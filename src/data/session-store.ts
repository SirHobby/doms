import { App, TFile, TFolder, normalizePath } from "obsidian";
import {
  compareDates,
  formatIsoDate,
  isWeekKey,
  parseIsoDate,
  today,
  weekKeyFor,
  WeekDay,
} from "./dates";
import { contentFolder, ideasFolder, logFolder, rehabFolder, sessionPath } from "./paths";
import type { MuscleGroup } from "./templates";
import type { CommitInput, SessionRecord, SlotKind } from "./types";

export interface StoreConfig {
  root: string;
  weekStart: WeekDay;
}

/**
 * Reads and writes session notes. The vault is the database (spec §1.5): there
 * is no index file, so every read is a scan of the log folder's frontmatter
 * through the metadata cache.
 */
export class SessionStore {
  constructor(
    private readonly app: App,
    private readonly config: () => StoreConfig,
  ) {}

  private get root(): string {
    return this.config().root;
  }

  /** Idempotent. Called lazily before the first write, never on plugin load. */
  async ensureFolders(): Promise<void> {
    const root = this.root;
    for (const path of [
      root,
      logFolder(root),
      contentFolder(root),
      ideasFolder(root),
      rehabFolder(root),
    ]) {
      await this.ensureFolder(path);
    }
  }

  private async ensureFolder(path: string): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFolder) return;
    if (existing) {
      throw new Error(`D.O.M.S: ${path} exists but is not a folder.`);
    }
    await this.app.vault.createFolder(path);
  }

  /** Every valid session note in the log folder, oldest first. */
  listSessions(): SessionRecord[] {
    const prefix = `${logFolder(this.root)}/`;
    const records: SessionRecord[] = [];

    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;
      const record = this.parse(file);
      if (record) records.push(record);
    }

    records.sort(
      (a, b) => compareDates(a.date, b.date) || a.file.path.localeCompare(b.file.path),
    );
    return records;
  }

  /**
   * Frontmatter comes from the metadata cache, never from parsing the file by
   * hand (spec §9). Anything malformed is skipped rather than throwing — one
   * bad note should not take down the whole week view.
   */
  parse(file: TFile): SessionRecord | null {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!fm || fm.doms !== "session") return null;

    const date = parseIsoDate(fm.date);
    if (!date) return null;

    const templateId = typeof fm.template === "string" ? fm.template : null;
    if (!templateId) return null;

    const sets = parseSets(fm.sets);
    if (!sets) return null;

    const slot: SlotKind =
      fm.slot === "bonus" ? "bonus" : fm.slot === "other" ? "other" : "required";
    const activity = typeof fm.activity === "string" ? fm.activity : null;
    const planId = typeof fm.plan === "string" && fm.plan.trim() ? fm.plan.trim() : null;

    // week is denormalized on disk, but a hand-edited or stale value would
    // silently misfile a session, so it is recomputed from the date.
    const weekKey = weekKeyFor(date, this.config().weekStart);

    return {
      file,
      date,
      dateIso: formatIsoDate(date),
      weekKey,
      storedWeekKey: isWeekKey(fm.week) ? fm.week : null,
      templateId,
      planId,
      slot,
      sets,
      totalSets: sumValues(sets),
      activity,
    };
  }

  /**
   * Writes one session note. Nothing touches disk until this is called, which
   * is what makes cancel and undo trivial (spec §4.2).
   */
  async commit(input: CommitInput): Promise<SessionRecord> {
    await this.ensureFolders();

    const date = input.date ?? today();
    const dateIso = formatIsoDate(date);
    const sets = parseSets(input.sets) ?? {};
    const total = sumValues(sets);
    const weekKey = weekKeyFor(date, this.config().weekStart);

    const path = await this.freePath(dateIso);
    const body = input.note?.trim() ? `${input.note.trim()}\n` : "";
    const file = await this.app.vault.create(path, body);

    // Non-gym activity never competes for a slot. Otherwise, a second session
    // of the same template in the same week is a bonus (spec §2).
    const slot: SlotKind =
      input.kind === "other"
        ? "other"
        : this.wouldBeBonus(weekKey, input.templateId, file)
          ? "bonus"
          : "required";
    const activity = input.activity?.trim() || null;

    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm.doms = "session";
      fm.date = dateIso;
      fm.week = weekKey;
      fm.template = input.templateId;
      if (input.planId) fm.plan = input.planId;
      fm.slot = slot;
      fm.sets = sets;
      fm.total_sets = total;
      if (activity) fm.activity = activity;
    });

    // processFrontMatter returns before Obsidian has re-indexed the file, so a
    // caller doing `await commit(); weekState()` would miss the session it just
    // wrote. Wait for the cache to catch up before handing back control.
    await this.waitForCache(file);

    return {
      file,
      date,
      dateIso,
      weekKey,
      storedWeekKey: weekKey,
      templateId: input.templateId,
      planId: input.planId ?? null,
      slot,
      sets,
      totalSets: total,
      activity,
    };
  }

  /**
   * Resolves once the metadata cache reflects `file`, or after a timeout. The
   * listener removes itself on both paths, so nothing outlives the promise.
   */
  private waitForCache(file: TFile, timeoutMs = 3000): Promise<void> {
    if (this.app.metadataCache.getFileCache(file)?.frontmatter?.doms === "session") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let timer = 0;

      const ref = this.app.metadataCache.on("changed", (changed) => {
        if (changed.path !== file.path) return;
        this.app.metadataCache.offref(ref);
        window.clearTimeout(timer);
        resolve();
      });

      timer = window.setTimeout(() => {
        this.app.metadataCache.offref(ref);
        resolve();
      }, timeoutMs);
    });
  }

  /**
   * Sessions whose on-disk `week` no longer matches the configured week start.
   * The plugin itself is immune (it recomputes), but Dataview and Bases queries
   * read the stored value, so it has to be repairable.
   */
  staleSessions(): SessionRecord[] {
    return this.listSessions().filter(
      (record) => record.storedWeekKey !== record.weekKey,
    );
  }

  /** Rewrites stale `week` values in place. Body text and unknown keys survive. */
  async rewriteWeekKeys(): Promise<number> {
    const stale = this.staleSessions();
    for (const record of stale) {
      await this.app.fileManager.processFrontMatter(record.file, (fm) => {
        fm.week = record.weekKey;
      });
    }
    return stale.length;
  }

  /** Sessions logged before plans existed, so their history has no plan. */
  sessionsMissingPlan(): SessionRecord[] {
    return this.listSessions().filter((record) => record.planId === null);
  }

  /**
   * Writes a plan id onto sessions that have none. Offered when the user
   * switches plans, so weeks already logged stay judged by what was actually
   * being run at the time rather than by whatever is selected later.
   */
  async stampPlan(planId: string): Promise<number> {
    const missing = this.sessionsMissingPlan();
    for (const record of missing) {
      await this.app.fileManager.processFrontMatter(record.file, (fm) => {
        fm.plan = planId;
      });
    }
    return missing.length;
  }

  /** Undo. Goes to the vault trash rather than a hard delete. */
  async undo(record: SessionRecord): Promise<void> {
    await this.app.fileManager.trashFile(record.file);
  }

  private wouldBeBonus(
    weekKey: string,
    templateId: string,
    exclude: TFile,
  ): boolean {
    return this.listSessions().some(
      (s) =>
        s.file.path !== exclude.path &&
        s.weekKey === weekKey &&
        s.templateId === templateId,
    );
  }

  /** Appends -2, -3 … until the name is free (spec §5). */
  private async freePath(dateIso: string): Promise<string> {
    for (let index = 1; index < 100; index++) {
      const path = sessionPath(this.root, dateIso, index);
      if (!this.app.vault.getAbstractFileByPath(normalizePath(path))) {
        return path;
      }
    }
    throw new Error(`D.O.M.S: too many sessions logged on ${dateIso}.`);
  }
}

/**
 * Zero is dropped, not stored. A template can then offer every muscle group or
 * rehab area as an option without a session note recording a wall of `: 0`
 * lines for everything the user did not do.
 */
function parseSets(raw: unknown): Record<MuscleGroup, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const out: Record<MuscleGroup, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const count = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(count) || count <= 0) continue;
    out[key] = Math.round(count);
  }
  return out;
}

function sumValues(sets: Record<MuscleGroup, number>): number {
  let total = 0;
  for (const value of Object.values(sets)) total += value;
  return total;
}

export { parseSets, sumValues };

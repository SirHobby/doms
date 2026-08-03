import { App } from "obsidian";
import { CivilDate, today, WeekDay } from "./dates";
import { SessionStore } from "./session-store";
import { clampCustomSessions, findPlan, type Plan } from "./plans";
import { DEFAULT_TEMPLATES, Template } from "./templates";
import type { CommitInput, SessionRecord, StreakState, WeekState } from "./types";
import {
  computeStreaks,
  deriveWeekState,
  type DeriveOptions,
} from "./week-state";

export interface DataConfig {
  root: string;
  weekStart: WeekDay;
  planId: string;
  /** The weekly bar on the custom plan. Ignored by every other plan. */
  customSessions: number;
}

/**
 * The whole data layer behind one object. Phase 2 has no UI, so this is the
 * seam the console pokes at:
 *
 *   const doms = app.plugins.plugins.doms;
 *   doms.data.weekState();
 *   await doms.data.commit({ templateId: "lower", sets: { quads: 5 } });
 */
export class DomsData {
  readonly store: SessionStore;

  constructor(
    app: App,
    private readonly config: () => DataConfig,
  ) {
    this.store = new SessionStore(app, config);
  }

  get templates(): readonly Template[] {
    return DEFAULT_TEMPLATES;
  }

  get plan(): Plan {
    return findPlan(this.config().planId);
  }

  /**
   * Everything the derivation functions need, in one place.
   *
   * Public because the Stats tab and the activity widget need the identical
   * shape: three call sites building it by hand is how a new field ends up
   * wired into one screen and silently missing from the others.
   */
  get options(): DeriveOptions {
    return {
      weekStart: this.config().weekStart,
      templates: this.templates,
      plan: this.plan,
      customSessions: clampCustomSessions(this.config().customSessions),
    };
  }

  ensureFolders(): Promise<void> {
    return this.store.ensureFolders();
  }

  sessions(): SessionRecord[] {
    return this.store.listSessions();
  }

  weekState(date: CivilDate = today()): WeekState {
    return deriveWeekState(this.sessions(), date, this.options);
  }

  streaks(now: CivilDate = today()): StreakState {
    return computeStreaks(this.sessions(), this.options, now);
  }

  commit(input: CommitInput): Promise<SessionRecord> {
    // The store does not know about templates, so resolve the kind here — it is
    // what decides whether the session can fill a slot.
    const kind =
      input.kind ??
      this.templates.find((t) => t.id === input.templateId)?.kind ??
      "strength";
    return this.store.commit({ ...input, kind, planId: input.planId ?? this.plan.id });
  }

  undo(record: SessionRecord): Promise<void> {
    return this.store.undo(record);
  }

  /** Convenience for the console and, later, the "Log as planned" button. */
  commitAsPlanned(templateId: string, date?: CivilDate): Promise<SessionRecord> {
    const template = this.templates.find((t) => t.id === templateId);
    if (!template) throw new Error(`D.O.M.S: unknown template "${templateId}".`);
    return this.commit({ templateId, sets: { ...template.sets }, date });
  }
}

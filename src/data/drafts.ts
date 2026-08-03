/**
 * In-progress sessions, kept across a view teardown.
 *
 * The session sheet writes nothing to disk until you commit, which is what makes
 * cancel and undo trivial (spec §4.2). The cost of that was everything living in
 * one component's memory: switch tabs, open a note, or let the phone sleep long
 * enough for Obsidian to drop the leaf, and a half-counted workout was gone.
 * That is precisely the moment it matters, because the counting happens *during*
 * the session rather than after it.
 *
 * A draft is therefore the counted state, persisted on every change. It is not a
 * session: nothing appears in the log, in the week count or in the stats until
 * the user commits. Undo still just deletes one file.
 */

import type { MuscleGroup } from "./muscles";
import { formatIsoDate, parseIsoDate, today, type CivilDate } from "./dates";

export interface SessionDraft {
  templateId: string;
  /** The day being logged for, as chosen in the sheet header. */
  dateIso: string;
  /** Counted so far. Body parts the user added are in here too. */
  sets: Record<MuscleGroup, number>;
  /** Free text typed into the note field. */
  note: string;
  /** Only for activity sheets — cardio and "a different workout". */
  activity: string;
  /** Epoch ms of the last edit. Drives the stale sweep. */
  updatedAt: number;
}

export type DraftMap = Record<string, SessionDraft>;

/**
 * Drafts are keyed by workout *and* day, so starting a second workout never
 * clobbers the first, and a session you backdated stays attached to the day it
 * belongs to rather than to whichever week you happen to be looking at.
 */
export function draftKey(templateId: string, dateIso: string): string {
  return `${templateId}|${dateIso}`;
}

export function draftKeyFor(templateId: string, date: CivilDate): string {
  return draftKey(templateId, formatIsoDate(date));
}

export function keyOf(draft: SessionDraft): string {
  return draftKey(draft.templateId, draft.dateIso);
}

/**
 * A draft nobody came back to is a draft nobody wants. Without a sweep, one
 * abandoned tap leaves an "In progress" card on a slot forever, and the user has
 * to clear a workout they do not remember starting.
 */
export const DRAFT_TTL_DAYS = 7;

export function isStale(
  draft: SessionDraft,
  now: number = Date.now(),
): boolean {
  return now - draft.updatedAt > DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000;
}

/** Total counted so far. What the "In progress" line reports. */
export function draftTotal(draft: SessionDraft): number {
  let total = 0;
  for (const value of Object.values(draft.sets)) total += value;
  return total;
}

/**
 * True when there is something worth keeping. An opened-then-abandoned sheet has
 * counted nothing and typed nothing, and should not leave a card behind.
 */
export function isWorthKeeping(draft: SessionDraft): boolean {
  return (
    draftTotal(draft) > 0 ||
    draft.note.length > 0 ||
    draft.activity.length > 0
  );
}

export function newDraft(
  templateId: string,
  date: CivilDate = today(),
): SessionDraft {
  return {
    templateId,
    dateIso: formatIsoDate(date),
    sets: {},
    note: "",
    activity: "",
    updatedAt: Date.now(),
  };
}

/** The day a draft is for, or today if the stored value is unusable. */
export function draftDate(draft: SessionDraft): CivilDate {
  return parseIsoDate(draft.dateIso) ?? today();
}

/**
 * Drafts arrive from disk as untrusted JSON, same as settings: a hand-edited or
 * older data.json must not be able to put a negative set count or a non-object
 * where the sheet expects one. Anything unrecognised is dropped rather than
 * repaired, because a draft is disposable by definition.
 */
export function normalizeDrafts(raw: unknown): DraftMap {
  if (!raw || typeof raw !== "object") return {};

  const out: DraftMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const draft = normalizeDraft(value);
    if (draft) out[key] = draft;
  }
  return out;
}

function normalizeDraft(raw: unknown): SessionDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  if (typeof data.templateId !== "string" || !data.templateId) return null;
  if (!parseIsoDate(data.dateIso)) return null;

  const sets: Record<MuscleGroup, number> = {};
  if (data.sets && typeof data.sets === "object") {
    for (const [muscle, count] of Object.entries(
      data.sets as Record<string, unknown>,
    )) {
      // Whole, non-negative counts only. A stepper can never produce anything
      // else, so anything else came from a hand edit.
      if (typeof count === "number" && Number.isInteger(count) && count >= 0) {
        sets[muscle] = count;
      }
    }
  }

  return {
    templateId: data.templateId,
    dateIso: data.dateIso as string,
    sets,
    note: typeof data.note === "string" ? data.note : "",
    activity: typeof data.activity === "string" ? data.activity : "",
    updatedAt:
      typeof data.updatedAt === "number" && Number.isFinite(data.updatedAt)
        ? data.updatedAt
        : Date.now(),
  };
}

/** Drops stale and empty drafts. Run on load, so a sweep costs no extra write. */
export function sweepDrafts(
  drafts: DraftMap,
  now: number = Date.now(),
): DraftMap {
  const out: DraftMap = {};
  for (const [key, draft] of Object.entries(drafts)) {
    if (isStale(draft, now) || !isWorthKeeping(draft)) continue;
    out[key] = draft;
  }
  return out;
}

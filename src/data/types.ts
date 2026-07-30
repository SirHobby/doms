import type { TFile } from "obsidian";
import type { CivilDate } from "./dates";
import type { MuscleGroup, TemplateKind } from "./templates";

/** `slot` as written to frontmatter (spec §5). */
export type SlotKind = "required" | "bonus" | "other";

/** One parsed session note. */
export interface SessionRecord {
  file: TFile;
  date: CivilDate;
  /** ISO date string, as stored. */
  dateIso: string;
  /** Recomputed from the date. This is the one to trust. */
  weekKey: string;
  /**
   * The `week` value actually on disk. Differs from weekKey when the user has
   * changed their week start day since the note was written, which matters
   * because external queries (Dataview, Bases) read the stored value.
   */
  storedWeekKey: string | null;
  templateId: string;
  /**
   * The plan in force when this was logged. Null on notes written before plans
   * existed, or hand-written ones — those fall back to the current plan.
   */
  planId: string | null;
  slot: SlotKind;
  sets: Record<MuscleGroup, number>;
  totalSets: number;
  /** Only set for "other" sessions, e.g. "Hike". */
  activity: string | null;
}

export interface CommitInput {
  templateId: string;
  sets: Record<MuscleGroup, number>;
  /** What the session was, for "other" templates. */
  activity?: string;
  /** Resolved from the template by DomsData. */
  kind?: TemplateKind;
  /** Stamped onto the note so history stays true to what was actually run. */
  planId?: string;
  /** Defaults to today. */
  date?: CivilDate;
  /** Free form body text, preserved verbatim. */
  note?: string;
}

/** One of the three required slots for a given week. */
export interface SlotState {
  templateId: string;
  name: string;
  done: boolean;
  /** The session that filled it, if any. */
  session: SessionRecord | null;
}

export interface WeekState {
  weekKey: string;
  startIso: string;
  endIso: string;
  /** Counting today. 7 on the first day of the week. */
  daysLeft: number;
  slots: SlotState[];
  requiredDone: number;
  requiredTotal: number;
  complete: boolean;
  /** Extra gym sessions beyond the three required slots. */
  bonusSessions: SessionRecord[];
  /** Non-gym activity logged this week. Never fills a slot. */
  otherSessions: SessionRecord[];
  /** True once all required slots are filled — bonus is hidden before that. */
  bonusUnlocked: boolean;
  /** What the week actually covered, per muscle. Diagnostic, not a goal. */
  volume: Record<MuscleGroup, number>;
  totalSets: number;
}

export interface StreakState {
  /** Consecutive complete weeks ending now. An in-progress week never breaks it. */
  current: number;
  best: number;
}

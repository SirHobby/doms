import {
  CivilDate,
  dayIndexInWeek,
  daysInMonth,
  formatIsoDate,
  monthLabel,
  today,
  weekdayLabels,
  weekKeyFor,
} from "./dates";
import type { SessionRecord } from "./types";
import { muscleLabel, muscleRank, type MuscleGroup } from "./muscles";
import { computeStreaks, planForWeek, type DeriveOptions } from "./week-state";
import { trackedTargets } from "./volume";

/**
 * Stats needs exactly what week derivation needs, so it is one shape rather than
 * two that have to be kept in step.
 */
export type StatsOptions = DeriveOptions;

export interface StatsSummary {
  totalSessions: number;
  totalSets: number;
  currentStreak: number;
  bestStreak: number;
}

export function summarize(
  sessions: readonly SessionRecord[],
  options: StatsOptions,
  now: CivilDate = today(),
): StatsSummary {
  const streaks = computeStreaks(sessions, options, now);
  let totalSets = 0;
  for (const session of sessions) totalSets += session.totalSets;

  return {
    totalSessions: sessions.length,
    totalSets,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
  };
}

/** One square in the activity calendar. */
export interface DayCell {
  date: CivilDate;
  dateIso: string;
  sets: number;
  sessions: SessionRecord[];
  /**
   * 0-4. A day with a session always scores at least 1, so "a different
   * workout" (which logs no sets) still shows up as activity.
   */
  level: 0 | 1 | 2 | 3 | 4;
}

/** Five buckets for the fill ramp. Level 0 is a day with nothing logged. */
export function intensityLevel(sets: number): 0 | 1 | 2 | 3 | 4 {
  if (sets <= 0) return 0;
  if (sets <= 6) return 1;
  if (sets <= 12) return 2;
  if (sets <= 18) return 3;
  return 4;
}

export interface MonthGrid {
  year: number;
  /** 1-12. */
  month: number;
  label: string;
  /** Weekday headers, ordered by the configured week start. */
  weekdays: string[];
  /**
   * Exactly enough whole weeks to cover the month. Days outside it are null so
   * the 1st lands under the right weekday.
   */
  cells: Array<DayCell | null>;
  /** Sessions logged in this month. */
  sessionCount: number;
  totalSets: number;
}

/**
 * One calendar month of activity. Cells are a fixed size and differ only in
 * fill, so the grid reads as a calendar rather than a bar chart.
 */
export function buildMonth(
  sessions: readonly SessionRecord[],
  year: number,
  month: number,
  options: StatsOptions,
): MonthGrid {
  const { weekStart } = options;

  const byDay = new Map<string, SessionRecord[]>();
  for (const session of sessions) {
    const list = byDay.get(session.dateIso);
    if (list) list.push(session);
    else byDay.set(session.dateIso, [session]);
  }

  const total = daysInMonth(year, month);
  const lead = dayIndexInWeek({ year, month, day: 1 }, weekStart);

  const cells: Array<DayCell | null> = Array.from({ length: lead }, () => null);
  let sessionCount = 0;
  let totalSets = 0;

  for (let day = 1; day <= total; day++) {
    const date: CivilDate = { year, month, day };
    const dateIso = formatIsoDate(date);
    const daySessions = byDay.get(dateIso) ?? [];

    let sets = 0;
    for (const session of daySessions) sets += session.totalSets;

    sessionCount += daySessions.length;
    totalSets += sets;

    cells.push({
      date,
      dateIso,
      sets,
      sessions: daySessions,
      // A logged day always shows, even with no sets behind it.
      level: daySessions.length === 0 ? 0 : (Math.max(1, intensityLevel(sets)) as 1 | 2 | 3 | 4),
    });
  }

  // Pad to whole weeks so the grid never has a ragged last row.
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    year,
    month,
    label: monthLabel(year, month),
    weekdays: weekdayLabels(weekStart),
    cells,
    sessionCount,
    totalSets,
  };
}

/** One tracked body part's progress toward this week's derived target. */
export interface WeeklySetRow {
  muscle: MuscleGroup;
  label: string;
  done: number;
  target: number;
}

/** A body part logged this week that carries no target. */
export interface WeeklyExtraRow {
  muscle: MuscleGroup;
  label: string;
  sets: number;
}

export interface WeeklySets {
  weekKey: string;
  /** Tracked body parts the week's plan asks for. Always rendered, even at zero. */
  tracked: WeeklySetRow[];
  /**
   * Everything else that was actually logged: abs, rehab work, and any tracked
   * group added as an extra on a plan that does not program it. Counts only,
   * never a bar — there is no goal to be short of.
   */
  extra: WeeklyExtraRow[];
}

/**
 * Sets completed against the weekly target, per body part, for the current week.
 *
 * This replaced a hit rate stat that was binary per muscle: you were inside the
 * band or you were not, so every bar was empty or full and nothing moved when
 * you logged a set. A proportion gives the page a reason to exist mid-week.
 *
 * The week is scored against the plan it was actually logged under, so switching
 * routines does not retroactively change what this week was asking for.
 */
export function weeklySets(
  sessions: readonly SessionRecord[],
  options: StatsOptions,
  now: CivilDate = today(),
): WeeklySets {
  const { weekStart, templates, plan } = options;
  const weekKey = weekKeyFor(now, weekStart);

  const delivered: Record<MuscleGroup, number> = {};
  for (const session of sessions) {
    if (session.weekKey !== weekKey) continue;
    for (const [muscle, count] of Object.entries(session.sets)) {
      delivered[muscle] = (delivered[muscle] ?? 0) + count;
    }
  }

  const weekPlan = planForWeek(weekKey, sessions, plan);
  const targets = trackedTargets(weekPlan, templates);

  const tracked: WeeklySetRow[] = targets.map((t) => ({
    muscle: t.muscle,
    label: muscleLabel(t.muscle),
    done: delivered[t.muscle] ?? 0,
    target: t.target,
  }));

  // Anything logged that no bar accounts for. Rendering a row per untracked
  // body part regardless would mean twenty empty rows saying nothing.
  const targeted = new Set(targets.map((t) => t.muscle));
  const extra: WeeklyExtraRow[] = Object.entries(delivered)
    .filter(([muscle, sets]) => sets > 0 && !targeted.has(muscle))
    .map(([muscle, sets]) => ({ muscle, label: muscleLabel(muscle), sets }))
    .sort((a, b) => muscleRank(a.muscle) - muscleRank(b.muscle));

  return { weekKey, tracked, extra };
}

export interface MuscleTotal {
  muscle: MuscleGroup;
  label: string;
  sets: number;
}

/** Cumulative sets per muscle, all time, biggest first. */
export function cumulativeVolume(
  sessions: readonly SessionRecord[],
): MuscleTotal[] {
  const totals: Record<MuscleGroup, number> = {};
  for (const session of sessions) {
    for (const [muscle, count] of Object.entries(session.sets)) {
      totals[muscle] = (totals[muscle] ?? 0) + count;
    }
  }

  return Object.entries(totals)
    .map(([muscle, sets]) => ({ muscle, label: muscleLabel(muscle), sets }))
    .sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle));
}

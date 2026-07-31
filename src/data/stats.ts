import {
  addDays,
  CivilDate,
  compareDates,
  dayIndexInWeek,
  daysInMonth,
  formatIsoDate,
  monthLabel,
  startOfWeek,
  today,
  weekdayLabels,
  weekKeyFor,
  WeekDay,
} from "./dates";
import type { Plan } from "./plans";
import type { MuscleGroup, Template } from "./templates";
import type { SessionRecord } from "./types";
import { computeStreaks, planForWeek } from "./week-state";
import { deriveVolumeTargets, isWithinBand, type VolumeTarget } from "./volume";

export interface StatsOptions {
  weekStart: WeekDay;
  templates: readonly Template[];
  plan: Plan;
}

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

export interface MuscleHitRate {
  muscle: MuscleGroup;
  /** Weeks where delivered volume landed inside the derived band. */
  hit: number;
  weeks: number;
  /** 0-1, or null when there is nothing to measure yet. */
  rate: number | null;
}

/**
 * How often each muscle's weekly volume landed inside its derived band, over
 * the trailing window (spec §4.4).
 *
 * Weeks before the user's first session are excluded — otherwise installing the
 * plugin today would show a 0% hit rate for the previous eleven weeks. Weeks
 * after that first session *are* counted even if empty, because skipping a week
 * genuinely is a miss.
 */
export function weeklyHitRate(
  sessions: readonly SessionRecord[],
  weekCount: number,
  options: StatsOptions,
  now: CivilDate = today(),
): MuscleHitRate[] {
  const { weekStart, templates, plan } = options;
  const targets = deriveVolumeTargets(plan, templates);
  if (sessions.length === 0) {
    return targets.map((t) => ({ muscle: t.muscle, hit: 0, weeks: 0, rate: null }));
  }

  const earliest = sessions.reduce<CivilDate>(
    (min, s) => (compareDates(s.date, min) < 0 ? s.date : min),
    sessions[0].date,
  );
  const firstTracked = startOfWeek(earliest, weekStart);

  const volumeByWeek = new Map<string, Record<MuscleGroup, number>>();
  for (const session of sessions) {
    let bucket = volumeByWeek.get(session.weekKey);
    if (!bucket) {
      bucket = {};
      volumeByWeek.set(session.weekKey, bucket);
    }
    for (const [muscle, count] of Object.entries(session.sets)) {
      bucket[muscle] = (bucket[muscle] ?? 0) + count;
    }
  }

  const windowStart = addDays(startOfWeek(now, weekStart), -(weekCount - 1) * 7);
  const counted: string[] = [];
  for (let i = 0; i < weekCount; i++) {
    const weekStartDate = addDays(windowStart, i * 7);
    if (compareDates(weekStartDate, firstTracked) < 0) continue;
    counted.push(weekKeyFor(weekStartDate, weekStart));
  }

  // Each week is scored against the band its own plan implies, so a week run
  // on push/pull/legs is not marked down for missing a three day target.
  const targetsByWeek = new Map<string, Map<MuscleGroup, VolumeTarget>>();
  for (const key of counted) {
    const weekPlan = planForWeek(key, sessions, plan);
    targetsByWeek.set(
      key,
      new Map(deriveVolumeTargets(weekPlan, templates).map((t) => [t.muscle, t])),
    );
  }

  return targets.map((target) => {
    let hit = 0;
    let weeks = 0;
    for (const key of counted) {
      // A muscle the week's plan never targeted is not counted against it.
      const weekTarget = targetsByWeek.get(key)?.get(target.muscle);
      if (!weekTarget) continue;
      weeks++;
      const delivered = volumeByWeek.get(key)?.[target.muscle] ?? 0;
      if (isWithinBand(weekTarget, delivered)) hit++;
    }
    return {
      muscle: target.muscle,
      hit,
      weeks,
      rate: weeks > 0 ? hit / weeks : null,
    };
  });
}

export interface MuscleTotal {
  muscle: MuscleGroup;
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
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle));
}

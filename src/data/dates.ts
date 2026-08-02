/**
 * Date helpers for D.O.M.S.
 *
 * Everything here works on a plain {year, month, day} civil date and does its
 * arithmetic in UTC milliseconds. A session logged the morning a DST shift
 * lands would otherwise drift by a day, which would put it in the wrong week.
 * No Date object ever crosses a module boundary.
 */

const MS_PER_DAY = 86_400_000;

export interface CivilDate {
  year: number;
  /** 1-12, not the 0-11 that Date uses. */
  month: number;
  day: number;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** 0 = Sunday, matching Date.getDay(). */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DEFAULT_WEEK_START: WeekDay = 1;

function toUtcMs(date: CivilDate): number {
  return Date.UTC(date.year, date.month - 1, date.day);
}

function fromUtcMs(ms: number): CivilDate {
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

export function today(): CivilDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function addDays(date: CivilDate, days: number): CivilDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

export function daysBetween(from: CivilDate, to: CivilDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function compareDates(a: CivilDate, b: CivilDate): number {
  return toUtcMs(a) - toUtcMs(b);
}

export function isSameDate(a: CivilDate, b: CivilDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** 0 = Sunday. */
export function dayOfWeek(date: CivilDate): WeekDay {
  return new Date(toUtcMs(date)).getUTCDay() as WeekDay;
}

export function formatIsoDate(date: CivilDate): string {
  const m = String(date.month).padStart(2, "0");
  const d = String(date.day).padStart(2, "0");
  return `${date.year}-${m}-${d}`;
}

/** "Mon 28 Jul" — short enough to sit beside a session title on a phone. */
export function formatShortDate(date: CivilDate): string {
  const weekday = DAY_NAMES[dayOfWeek(date)].slice(0, 3);
  return `${weekday} ${date.day} ${MONTH_NAMES[date.month - 1].slice(0, 3)}`;
}

/** "Monday, 28 July 2026" — for labels a screen reader has to read out. */
export function formatLongDate(date: CivilDate): string {
  return `${DAY_NAMES[dayOfWeek(date)]}, ${date.day} ${MONTH_NAMES[date.month - 1]} ${date.year}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Two-letter column headings for a calendar grid, rotated to `weekStart`. */
export function weekdayLabels(weekStart: WeekDay): string[] {
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    labels.push(DAY_NAMES[(weekStart + i) % 7].slice(0, 2));
  }
  return labels;
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Shifts a month by `delta`, wrapping the year. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: unknown): CivilDate | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;

  const candidate: CivilDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  // Rejects 2026-02-30, which Date would silently roll over to March.
  const roundTrip = fromUtcMs(toUtcMs(candidate));
  return isSameDate(candidate, roundTrip) ? candidate : null;
}

/** How far into the week `date` falls. 0 on the week start day. */
export function dayIndexInWeek(date: CivilDate, weekStart: WeekDay): number {
  return (dayOfWeek(date) - weekStart + 7) % 7;
}

export function startOfWeek(date: CivilDate, weekStart: WeekDay): CivilDate {
  return addDays(date, -dayIndexInWeek(date, weekStart));
}

export function endOfWeek(date: CivilDate, weekStart: WeekDay): CivilDate {
  return addDays(startOfWeek(date, weekStart), 6);
}

/**
 * Days remaining in the week, counting today. Monday of a Monday-start week
 * returns 7, Sunday returns 1 — "1 day left" should mean today is the last one.
 */
export function daysLeftInWeek(date: CivilDate, weekStart: WeekDay): number {
  return 7 - dayIndexInWeek(date, weekStart);
}

/**
 * `YYYY-Www`, the denormalized key stored on every session note (spec §5).
 *
 * Generalizes the ISO-8601 rule to an arbitrary start day: week 1 is the week
 * containing January 4th, and a week belongs to the year its fourth day falls
 * in. With the default Monday start this produces exactly ISO week numbers.
 */
export function weekKeyFor(date: CivilDate, weekStart: WeekDay): string {
  const start = startOfWeek(date, weekStart);
  const pivot = addDays(start, 3);
  const year = pivot.year;
  const firstWeekStart = startOfWeek({ year, month: 1, day: 4 }, weekStart);
  const week = Math.round(daysBetween(firstWeekStart, start) / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function isWeekKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-W\d{2}$/.test(value);
}

export function isWeekDay(value: unknown): value is WeekDay {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6
  );
}

/**
 * How far back a session can be logged.
 *
 * Backdating exists to fix a session you forgot to log, not to reconstruct a
 * training history from memory. Thirty days is well past the point where anyone
 * still remembers what they actually did.
 */
export const BACKDATE_LIMIT_DAYS = 30;

export function earliestLoggableDate(from: CivilDate = today()): CivilDate {
  return addDays(from, -BACKDATE_LIMIT_DAYS);
}

import type { SlotState, WeekState } from "./types";

export interface Suggestion {
  slot: SlotState;
  /** Copy for the nudge, or null for the plain "next up" case. */
  nudge: string | null;
}

/**
 * Full body is the time pressure recommendation: if the week is more than half
 * over and fewer than two slots are done, surface it first (spec §2).
 */
const FULL_BODY_ID = "full";

export function isSecondHalfOfWeek(week: WeekState): boolean {
  // 7 days, so "more than half over" is day 4 onward, i.e. 3 or fewer left.
  return week.daysLeft <= 3;
}

export function shouldNudgeFullBody(week: WeekState): boolean {
  return (
    isSecondHalfOfWeek(week) &&
    week.requiredDone < 2 &&
    week.slots.some((slot) => slot.templateId === FULL_BODY_ID && !slot.done)
  );
}

/**
 * The app suggests a next slot but never blocks one (spec §2). This only
 * affects ordering and a line of copy.
 */
export function suggestNext(week: WeekState): Suggestion | null {
  const open = week.slots.filter((slot) => !slot.done);
  if (open.length === 0) return null;

  if (shouldNudgeFullBody(week)) {
    const fullBody = open.find((slot) => slot.templateId === FULL_BODY_ID);
    if (fullBody) {
      return { slot: fullBody, nudge: "Short on time? Do this one." };
    }
  }

  return { slot: open[0], nudge: null };
}

/** Open slots in suggested order, completed ones after (spec §4.1). */
export function orderSlots(week: WeekState): SlotState[] {
  const suggestion = suggestNext(week);
  const open = week.slots.filter((slot) => !slot.done);
  const done = week.slots.filter((slot) => slot.done);

  if (suggestion) {
    const rest = open.filter((slot) => slot !== suggestion.slot);
    return [suggestion.slot, ...rest, ...done];
  }
  return [...open, ...done];
}

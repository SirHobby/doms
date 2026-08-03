import {
  addDays,
  CivilDate,
  compareDates,
  daysLeftInWeek,
  endOfWeek,
  formatIsoDate,
  startOfWeek,
  today,
  weekKeyFor,
  WeekDay,
} from "./dates";
import {
  findPlan,
  isCustomPlan,
  planTemplates,
  slotCount,
  type Plan,
} from "./plans";
import { describeSets } from "./muscles";
import { CUSTOM_TEMPLATE_ID, MuscleGroup, Template } from "./templates";
import type { SessionRecord, SlotState, StreakState, WeekState } from "./types";

export interface DeriveOptions {
  weekStart: WeekDay;
  templates: readonly Template[];
  /** Decides how many slots the week has and which templates fill them. */
  plan: Plan;
  /** The weekly bar on the custom plan, which has no slots to count. */
  customSessions: number;
}

/**
 * Derives everything the Week tab needs from the raw session list.
 *
 * The `slot` field written to frontmatter is for external queries (Dataview,
 * Bases). It is deliberately *not* trusted here: required/bonus is recomputed
 * so that hand-edited notes, or notes moved between weeks, still produce a
 * coherent week.
 */
export function deriveWeekState(
  sessions: readonly SessionRecord[],
  date: CivilDate,
  options: DeriveOptions,
): WeekState {
  const { weekStart, templates, plan } = options;
  const weekKey = weekKeyFor(date, weekStart);
  const required = planTemplates(plan, templates);

  const all = sessions.filter((s) => s.weekKey === weekKey);
  const otherIds = new Set(
    templates.filter((t) => t.kind === "other").map((t) => t.id),
  );
  const otherSessions = all.filter((s) => otherIds.has(s.templateId));
  const inWeek = all.filter((s) => !otherIds.has(s.templateId));

  if (isCustomPlan(plan)) {
    return customWeekState(inWeek, otherSessions, date, options);
  }

  const claimed = new Set<string>();
  const seen = new Map<string, number>();

  const slots: SlotState[] = required.map((template) => {
    // Sessions fill slots of their template in order, so a plan asking for two
    // push days is satisfied by two push sessions rather than one plus a bonus.
    const session =
      inWeek.find(
        (s) => s.templateId === template.id && !claimed.has(s.file.path),
      ) ?? null;
    if (session) claimed.add(session.file.path);

    const occurrence = (seen.get(template.id) ?? 0) + 1;
    seen.set(template.id, occurrence);
    const repeats = slotCount(plan, template.id);

    return {
      templateId: template.id,
      // "Push 1" and "Push 2" only when the plan actually asks for both.
      name: repeats > 1 ? `${template.name} ${occurrence}` : template.name,
      done: session !== null,
      session,
    };
  });

  const bonusSessions = inWeek.filter((s) => !claimed.has(s.file.path));

  const volume: Record<MuscleGroup, number> = {};
  let totalSets = 0;
  for (const session of inWeek) {
    for (const [muscle, count] of Object.entries(session.sets)) {
      volume[muscle] = (volume[muscle] ?? 0) + count;
      totalSets += count;
    }
  }

  const requiredDone = slots.filter((s) => s.done).length;

  return {
    weekKey,
    startIso: formatIsoDate(startOfWeek(date, weekStart)),
    endIso: formatIsoDate(endOfWeek(date, weekStart)),
    daysLeft: daysLeftInWeek(date, weekStart),
    slots,
    requiredDone,
    requiredTotal: slots.length,
    complete: slots.length > 0 && requiredDone === slots.length,
    bonusSessions,
    otherSessions,
    bonusUnlocked: slots.length > 0 && requiredDone === slots.length,
    volume,
    totalSets,
  };
}

/**
 * A readable name for a logged session.
 *
 * Custom workouts carry no stored name, so they are described by what they hit
 * — "Chest & shoulders" rather than five identical "Custom workout" rows. Cardio
 * and other activity already say what they were.
 */
export function sessionLabel(
  session: SessionRecord,
  templates: readonly Template[],
): string {
  if (session.activity) return session.activity;
  if (session.templateId === CUSTOM_TEMPLATE_ID) {
    return describeSets(session.sets);
  }
  const template = templates.find((t) => t.id === session.templateId);
  return template?.name ?? describeSets(session.sets);
}

/**
 * The custom routine's week.
 *
 * There are no slots to match sessions against, so the bar is a count: do the
 * number of workouts you set yourself. Anything logged counts, whatever it was,
 * which is the point of choosing this routine. Sessions past the bar become
 * bonus, exactly as an extra session does on a prescribed plan — turning up more
 * never raises the bar (spec §2).
 */
function customWeekState(
  inWeek: readonly SessionRecord[],
  otherSessions: readonly SessionRecord[],
  date: CivilDate,
  options: DeriveOptions,
): WeekState {
  const { weekStart, templates, customSessions } = options;

  const ordered = [...inWeek].sort((a, b) => compareDates(a.date, b.date));
  const counted = ordered.slice(0, customSessions);

  const slots: SlotState[] = [];
  for (let i = 0; i < customSessions; i++) {
    const session = counted[i] ?? null;
    slots.push({
      templateId: session?.templateId ?? CUSTOM_TEMPLATE_ID,
      name: session ? sessionLabel(session, templates) : `Workout ${i + 1}`,
      done: session !== null,
      session,
    });
  }

  const volume: Record<MuscleGroup, number> = {};
  let totalSets = 0;
  for (const session of ordered) {
    for (const [muscle, count] of Object.entries(session.sets)) {
      volume[muscle] = (volume[muscle] ?? 0) + count;
      totalSets += count;
    }
  }

  const requiredDone = counted.length;

  return {
    weekKey: weekKeyFor(date, weekStart),
    startIso: formatIsoDate(startOfWeek(date, weekStart)),
    endIso: formatIsoDate(endOfWeek(date, weekStart)),
    daysLeft: daysLeftInWeek(date, weekStart),
    slots,
    requiredDone,
    requiredTotal: customSessions,
    complete: requiredDone >= customSessions,
    bonusSessions: ordered.slice(customSessions),
    otherSessions: [...otherSessions],
    // Nothing to unlock: the custom routine offers one way to log and it is
    // available from the first session of the week.
    bonusUnlocked: false,
    volume,
    totalSets,
  };
}

/**
 * The plan a given week was actually run under.
 *
 * Sessions carry the plan in force when they were logged, so switching routines
 * does not retroactively rewrite whether past weeks were complete. Where the
 * sessions in a week disagree — a switch mid-week — the plan the majority were
 * logged under wins. Weeks with nothing logged, or notes predating plans, fall
 * back to the current one.
 */
export function planForWeek(
  weekKey: string,
  sessions: readonly SessionRecord[],
  fallback: Plan,
): Plan {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (session.weekKey !== weekKey || !session.planId) continue;
    counts.set(session.planId, (counts.get(session.planId) ?? 0) + 1);
  }
  if (counts.size === 0) return fallback;

  let best = fallback.id;
  let bestCount = -1;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return findPlan(best);
}

/**
 * Streaks count weeks with every required slot done, never consecutive days — a
 * day based streak would punish the rest days the plan requires (spec §2).
 */
export function computeStreaks(
  sessions: readonly SessionRecord[],
  options: DeriveOptions,
  now: CivilDate = today(),
): StreakState {
  const { weekStart } = options;
  const complete = completeWeekKeys(sessions, options);

  if (complete.size === 0) return { current: 0, best: 0 };

  const thisWeekStart = startOfWeek(now, weekStart);

  // Current streak. The in-progress week counts if it is already done, but an
  // unfinished one does not break the run — there is still time.
  let current = 0;
  let cursor = complete.has(weekKeyFor(thisWeekStart, weekStart))
    ? thisWeekStart
    : addDays(thisWeekStart, -7);

  while (complete.has(weekKeyFor(cursor, weekStart))) {
    current++;
    cursor = addDays(cursor, -7);
  }

  // Best streak: walk forward from the earliest logged week so that gaps
  // between weeks with no sessions at all correctly break the run.
  const earliest = sessions.reduce<CivilDate>(
    (min, s) => (compareDates(s.date, min) < 0 ? s.date : min),
    sessions[0].date,
  );

  let best = 0;
  let run = 0;
  let walk = startOfWeek(earliest, weekStart);
  while (compareDates(walk, thisWeekStart) <= 0) {
    if (complete.has(weekKeyFor(walk, weekStart))) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    walk = addDays(walk, 7);
  }

  return { current, best: Math.max(best, current) };
}

/**
 * Counting distinct templates is not enough once a plan can ask for the same
 * one twice: a week with a single push day would otherwise look complete on
 * push/pull/legs. Counts have to be compared with multiplicity.
 *
 * Each week is judged against the plan it was logged under, so switching
 * routines never invalidates a week that was genuinely completed.
 */
function completeWeekKeys(
  sessions: readonly SessionRecord[],
  options: DeriveOptions,
): Set<string> {
  const otherIds = new Set(
    options.templates.filter((t) => t.kind === "other").map((t) => t.id),
  );

  const byWeek = new Map<string, Map<string, number>>();
  // Gym sessions only, per week. "A different workout" never fills a slot and
  // never counts toward the custom bar either — a hike is logged, not required.
  const gymCount = new Map<string, number>();

  for (const session of sessions) {
    let counts = byWeek.get(session.weekKey);
    if (!counts) {
      counts = new Map<string, number>();
      byWeek.set(session.weekKey, counts);
    }
    counts.set(session.templateId, (counts.get(session.templateId) ?? 0) + 1);

    if (!otherIds.has(session.templateId)) {
      gymCount.set(session.weekKey, (gymCount.get(session.weekKey) ?? 0) + 1);
    }
  }

  const complete = new Set<string>();
  for (const [weekKey, counts] of byWeek) {
    const weekPlan = planForWeek(weekKey, sessions, options.plan);

    // The custom routine judges a week by how many times you turned up, not by
    // which sessions they were.
    //
    // It is judged against the bar as it stands today, not one stamped per week:
    // the number is the user's own, changed deliberately, and a history that
    // disagreed with the setting in front of them would be harder to explain
    // than one that moves with it.
    if (isCustomPlan(weekPlan)) {
      if ((gymCount.get(weekKey) ?? 0) >= options.customSessions) {
        complete.add(weekKey);
      }
      continue;
    }

    const needed = new Map<string, number>();
    for (const id of weekPlan.slots) needed.set(id, (needed.get(id) ?? 0) + 1);

    let ok = needed.size > 0;
    for (const [id, count] of needed) {
      if ((counts.get(id) ?? 0) < count) {
        ok = false;
        break;
      }
    }
    if (ok) complete.add(weekKey);
  }
  return complete;
}

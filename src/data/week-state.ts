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
import { findPlan, planTemplates, slotCount, type Plan } from "./plans";
import { MuscleGroup, Template } from "./templates";
import type { SessionRecord, SlotState, StreakState, WeekState } from "./types";

export interface DeriveOptions {
  weekStart: WeekDay;
  templates: readonly Template[];
  /** Decides how many slots the week has and which templates fill them. */
  plan: Plan;
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
  const byWeek = new Map<string, Map<string, number>>();
  for (const session of sessions) {
    let counts = byWeek.get(session.weekKey);
    if (!counts) {
      counts = new Map<string, number>();
      byWeek.set(session.weekKey, counts);
    }
    counts.set(session.templateId, (counts.get(session.templateId) ?? 0) + 1);
  }

  const complete = new Set<string>();
  for (const [weekKey, counts] of byWeek) {
    const weekPlan = planForWeek(weekKey, sessions, options.plan);

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

import { CUSTOM_TEMPLATE_ID, findTemplate, type Template } from "./templates";

/**
 * A plan is an ordered list of required slots for the week.
 *
 * A template id may appear more than once — push/pull/legs twice over means
 * six gym days — so slots are positions, not a set. Everything downstream
 * (streaks, volume targets, the bonus unlock) is derived from this list rather
 * than from a hardcoded three.
 */
export interface Plan {
  id: string;
  name: string;
  /** One line, shown under the picker. */
  description: string;
  /** Template ids, in suggested order. Repeats are meaningful. Empty if custom. */
  slots: string[];
  /**
   * A custom routine prescribes nothing. There are no slots to fill, so the
   * week's bar is a *count* of sessions the user sets themselves, and any
   * workout logged counts toward it whatever it was.
   *
   * The bar still exists, because it is the whole product thesis: the metric
   * that matters is whether you turned up as often as you said you would.
   * Dropping it here would leave a log rather than a tracker.
   */
  custom?: boolean;
}

export const DEFAULT_PLAN_ID = "three-day";

export const CUSTOM_PLAN_ID = "custom";

/** Bounds on the custom weekly count. One a week, up to two a day. */
export const MIN_CUSTOM_SESSIONS = 1;
export const MAX_CUSTOM_SESSIONS = 14;
export const DEFAULT_CUSTOM_SESSIONS = 3;

export function clampCustomSessions(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_CUSTOM_SESSIONS;
  }
  return Math.min(
    MAX_CUSTOM_SESSIONS,
    Math.max(MIN_CUSTOM_SESSIONS, Math.round(value)),
  );
}

export function isCustomPlan(plan: Plan): boolean {
  return plan.custom === true;
}

export const PLANS: readonly Plan[] = [
  {
    id: DEFAULT_PLAN_ID,
    name: "Three days a week",
    description:
      "Upper, lower, full body. Three sessions is the whole bar; anything else is a bonus.",
    slots: ["upper", "lower", "full"],
  },
  {
    id: "upper-lower",
    name: "Upper / lower, five days",
    description:
      "Two upper days, two lower days, and one cardio day.",
    slots: ["upper", "lower", "upper", "lower", "cardio"],
  },
  {
    id: "ppl",
    name: "Push / pull / legs, seven days",
    description:
      "Two full rounds of push, pull and legs, then a cardio day. The most demanding option.",
    slots: ["push", "pull", "legs", "push", "pull", "legs", "cardio"],
  },
  {
    id: CUSTOM_PLAN_ID,
    name: "Custom",
    description:
      "No prescribed sessions. Build each workout from the body parts you trained, and set your own number of sessions a week.",
    slots: [],
    custom: true,
  },
];

export function findPlan(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

/** How many slots a template fills in this plan. Zero if it is not in it. */
export function slotCount(plan: Plan, templateId: string): number {
  return plan.slots.filter((id) => id === templateId).length;
}

/** Resolved templates for each slot, in order. Unknown ids are dropped. */
export function planTemplates(
  plan: Plan,
  templates: readonly Template[],
): Template[] {
  const out: Template[] = [];
  for (const id of plan.slots) {
    const template = findTemplate(id, templates);
    if (template) out.push(template);
  }
  return out;
}

/**
 * Templates offered as a bonus: gym work the plan does not already require.
 * On the three day plan that is push, pull, legs and rehab; on push/pull/legs
 * it becomes upper, lower, full body and rehab.
 */
export function bonusTemplatesFor(
  plan: Plan,
  templates: readonly Template[],
): Template[] {
  // A custom routine requires nothing, so nothing can be extra to it. Every
  // session is logged the same way and counts the same amount.
  if (isCustomPlan(plan)) return [];

  return templates.filter(
    (t) =>
      t.kind === "strength" &&
      !plan.slots.includes(t.id) &&
      // The custom workout has its own card on every plan. Offering it here too
      // would be a second door onto the same sheet.
      t.id !== CUSTOM_TEMPLATE_ID &&
      // Days built on the custom routine stay there.
      !t.userDefined,
  );
}

/**
 * Everything that can be logged, with the plan's own sessions first.
 *
 * Used where there is no week state to order things by — logging a previous
 * workout, where the whole point is that the week in question has closed.
 * Repeats collapse: "which workout was it" is answered by the template, not by
 * which of two push slots it would have filled.
 */
export function loggableTemplates(
  plan: Plan,
  templates: readonly Template[],
): Template[] {
  const inPlan: Template[] = [];
  const seen = new Set<string>();

  for (const id of plan.slots) {
    if (seen.has(id)) continue;
    const template = findTemplate(id, templates);
    if (template) {
      inPlan.push(template);
      seen.add(id);
    }
  }

  return [...inPlan, ...templates.filter((t) => !seen.has(t.id))];
}

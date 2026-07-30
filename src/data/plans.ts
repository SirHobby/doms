import { findTemplate, type Template } from "./templates";

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
  /** Template ids, in suggested order. Repeats are meaningful. */
  slots: string[];
}

export const DEFAULT_PLAN_ID = "three-day";

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
  return templates.filter(
    (t) => t.kind === "strength" && !plan.slots.includes(t.id),
  );
}

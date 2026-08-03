/** Default plan data from spec §3. Templates are data, editable later. */

import {
  LATS_LOWER_BACK,
  MUSCLE_GROUPS,
  UPPER_BACK,
  type MuscleGroup,
} from "./muscles";

export type { MuscleGroup };

/**
 * Areas offered on a rehab day: everything the canonical list marks as rehab or
 * accessory work, plus the two leg groups that genuinely get rehabbed.
 *
 * A rehab day is pick-and-choose — you do the two or three things that feel off,
 * not the whole list — so most of these default to zero sets. Zero-set entries
 * are dropped at commit, which is what lets the sheet offer everything without
 * inflating what gets logged.
 */
export const REHAB_AREAS: readonly MuscleGroup[] = [
  ...MUSCLE_GROUPS.filter((m) => m.section === "rehab").map((m) => m.id),
  // Tracked leg groups, offered here too: a rehabbed hamstring or achilles is
  // still hamstring and calf work, so it counts toward those weekly bars rather
  // than becoming a shadow group that means the same thing.
  //
  // Quads are deliberately not here. Patellar and quad tendon rehab is quad
  // loading, but that is exactly what the "knees" area already is — Spanish
  // squats, wall sits, terminal knee extension — so a quads entry would be a
  // second name for one thing rather than coverage of a gap.
  "hamstrings",
  "calves",
];

/**
 * The rehab areas that open with a suggested count. Everything else in
 * REHAB_AREAS starts at zero and is dropped at commit unless you count it.
 *
 * These four are the ones people actually come back to week after week, so they
 * are pre-filled; the rest are offers.
 */
const REHAB_SUGGESTED: Record<MuscleGroup, number> = {
  "rotator cuff": 3,
  neck: 2,
  hips: 3,
  ankles: 2,
};

/**
 * Built from REHAB_AREAS rather than written out by hand.
 *
 * The two lists were maintained separately and had already drifted: adding a
 * body part to the canonical list put it in the picker but not on the rehab
 * sheet, which is a silent gap nobody notices until they go looking for it.
 */
function rehabSets(): Record<MuscleGroup, number> {
  const sets: Record<MuscleGroup, number> = {};
  for (const area of REHAB_AREAS) sets[area] = REHAB_SUGGESTED[area] ?? 0;
  return sets;
}

/**
 * What a template is, not what role it plays — the active plan decides which
 * templates are required and which are offered as a bonus.
 *
 * "strength" is gym work with muscle groups and set counts.
 * "cardio" is a conditioning slot: it records an activity rather than sets.
 * "other" is activity outside the plan entirely. It never fills a slot.
 */
export type TemplateKind = "strength" | "cardio" | "other";

/** The build-it-yourself workout. Offered on every plan, required by none. */
export const CUSTOM_TEMPLATE_ID = "custom";

export interface Template {
  id: string;
  name: string;
  kind: TemplateKind;
  /** muscle group -> suggested set count */
  sets: Record<MuscleGroup, number>;
}

export const DEFAULT_TEMPLATES: readonly Template[] = [
  // The three-day templates keep the set counts they have always had. Their
  // session totals are already about right at 16-17 sets, and the weekly target
  // for each muscle is derived from whatever the plan delivers, so there is
  // nothing here to normalize upward.
  //
  // The only change is the back split, applied in place: the old single `back`
  // number is halved across the two groups that replaced it, odd set to upper
  // back. Session totals are unchanged.
  {
    id: "upper",
    name: "Upper body",
    kind: "strength",
    sets: {
      chest: 4,
      [UPPER_BACK]: 2,
      [LATS_LOWER_BACK]: 2,
      shoulders: 3,
      biceps: 2,
      triceps: 2,
      core: 1,
    },
  },
  {
    id: "lower",
    name: "Lower body",
    kind: "strength",
    sets: { quads: 5, hamstrings: 4, glutes: 4, calves: 3 },
  },
  {
    id: "full",
    name: "Full body",
    kind: "strength",
    sets: {
      chest: 3,
      [UPPER_BACK]: 2,
      [LATS_LOWER_BACK]: 1,
      shoulders: 2,
      quads: 3,
      hamstrings: 2,
      glutes: 2,
      core: 2,
    },
  },

  // Push, pull and legs are sized so that two exposures a week land every
  // tracked group on twelve sets. Six gym days previously delivered eight to
  // twelve sets per muscle, which is less than the three-day plan asks of some
  // groups — a lot of time in the gym for volume that did not reflect it.
  {
    id: "push",
    name: "Push",
    kind: "strength",
    sets: { chest: 6, shoulders: 6, triceps: 6 },
  },
  {
    id: "pull",
    name: "Pull",
    kind: "strength",
    // Shoulders is gone: it was standing in for upper back work, which now has
    // its own group. Forearms and grip get trained on pull day in practice, so
    // they are on the sheet rather than left to be remembered.
    sets: {
      [UPPER_BACK]: 6,
      [LATS_LOWER_BACK]: 6,
      biceps: 6,
      forearms: 6,
    },
  },
  {
    id: "legs",
    name: "Legs",
    kind: "strength",
    sets: { quads: 6, hamstrings: 6, glutes: 6, calves: 6 },
  },
  {
    id: "rehab",
    name: "Rehab",
    kind: "strength",
    // Every rehab area is offered; the common ones carry a suggested count and
    // the rest start at zero. Kept out of the derived volume targets, which are
    // computed from the required templates only.
    sets: rehabSets(),
  },
  {
    id: "cardio",
    name: "Cardio",
    kind: "cardio",
    // Conditioning is recorded as an activity, not as sets per muscle.
    sets: {},
  },
  {
    id: CUSTOM_TEMPLATE_ID,
    name: "Custom workout",
    kind: "strength",
    // Deliberately empty. The sheet opens with no rows and you add the body
    // parts you actually trained, which is the point: a workout the plugin
    // never prescribed still has to be loggable as gym work, counting toward
    // the week and the volume readout like any other.
    sets: {},
  },
  {
    id: "other",
    name: "A different workout",
    kind: "other",
    // No muscle groups: this records that something happened, not what it hit.
    sets: {},
  },
] as const;

/** Suggested conditioning for a cardio slot. Free text is always allowed. */
export const CARDIO_ACTIVITIES = [
  "Zone 2 cycling",
  "Rowing intervals",
  "Incline treadmill walk",
  "Easy run",
  "Assault bike",
  "Stair climber",
  "Jump rope",
  "Swim",
  "Ruck",
] as const;

export const CARDIO_TEMPLATE_ID = "cardio";

/**
 * Suggestions for "a different workout". Free text is always allowed — this is
 * just a fast path for the common ones.
 */
export const DEFAULT_ACTIVITIES = [
  "Bike ride",
  "Hike",
  "Run",
  "Swim",
  "Pickleball",
  "Rock climbing",
  "Walk",
  "Yoga",
  "Sport",
] as const;

export const OTHER_TEMPLATE_ID = "other";



export function findTemplate(
  id: string,
  templates: readonly Template[] = DEFAULT_TEMPLATES,
): Template | null {
  return templates.find((t) => t.id === id) ?? null;
}

export function templateTotal(template: Template): number {
  return sumSets(template.sets);
}

export function sumSets(sets: Record<MuscleGroup, number>): number {
  let total = 0;
  for (const value of Object.values(sets)) total += value;
  return total;
}

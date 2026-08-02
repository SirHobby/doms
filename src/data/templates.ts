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
  "hamstrings",
  "calves",
];

/**
 * What a template is, not what role it plays — the active plan decides which
 * templates are required and which are offered as a bonus.
 *
 * "strength" is gym work with muscle groups and set counts.
 * "cardio" is a conditioning slot: it records an activity rather than sets.
 * "other" is activity outside the plan entirely. It never fills a slot.
 */
export type TemplateKind = "strength" | "cardio" | "other";

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
    sets: {
      "rotator cuff": 3,
      "shoulder blades": 0,
      neck: 2,
      "thoracic spine": 0,
      wrists: 0,
      elbows: 0,
      "deep core": 0,
      "lower back": 0,
      hips: 3,
      "hip flexors": 0,
      knees: 0,
      hamstrings: 0,
      calves: 0,
      ankles: 2,
      feet: 0,
      balance: 0,
    },
  },
  {
    id: "cardio",
    name: "Cardio",
    kind: "cardio",
    // Conditioning is recorded as an activity, not as sets per muscle.
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

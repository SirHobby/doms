/** Default plan data from spec §3. Templates are data, editable later. */

/**
 * Areas trained on a rehab day. Separate from the main muscle groups on purpose:
 * they are stabilisers, and mixing them into the volume readout would distort it.
 *
 * The rehab template lists all of them, but most default to zero sets. A rehab
 * day is pick-and-choose — you do the two or three things that feel off, not the
 * whole list — and zero-set entries are dropped at commit, so the sheet can
 * offer everything without inflating what gets logged.
 */
export const REHAB_AREAS = [
  "rotator cuff",
  "shoulder blades",
  "neck",
  "thoracic spine",
  "wrists",
  "elbows",
  "deep core",
  "lower back",
  "hips",
  "hip flexors",
  "knees",
  "hamstrings",
  "calves",
  "ankles",
  "feet",
  "balance",
] as const;

export const DEFAULT_MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
] as const;

export type MuscleGroup = string;

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
  {
    id: "upper",
    name: "Upper body",
    kind: "strength",
    sets: { chest: 4, back: 4, shoulders: 3, biceps: 2, triceps: 2, core: 1 },
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
      back: 3,
      shoulders: 2,
      quads: 3,
      hamstrings: 2,
      glutes: 2,
      core: 2,
    },
  },
  {
    id: "push",
    name: "Push",
    kind: "strength",
    sets: { chest: 5, shoulders: 4, triceps: 4 },
  },
  {
    id: "pull",
    name: "Pull",
    kind: "strength",
    sets: { back: 6, biceps: 4, shoulders: 2 },
  },
  {
    id: "legs",
    name: "Legs",
    kind: "strength",
    sets: { quads: 5, hamstrings: 4, glutes: 4, calves: 4 },
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

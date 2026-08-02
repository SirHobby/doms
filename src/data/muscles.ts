/**
 * The canonical body part list.
 *
 * Before this existed, a "muscle group" was whatever string a template happened
 * to declare, and every screen derived its rows from logged data. That worked
 * until two groups needed splitting and a third needed adding, at which point
 * there was nowhere to make the change. This is the single source of truth:
 * templates, the logging sheet, the weekly readout, the all time readout and
 * the "add a body part" picker all resolve through it.
 *
 * Ids are lowercase and human readable because they are written straight into
 * session frontmatter, where the user reads them and queries them with Dataview.
 */

export type MuscleGroup = string;

/** Picker grouping, and the order body parts are offered in. */
export type MuscleSection = "push" | "pull" | "legs" | "core" | "rehab";

export const MUSCLE_SECTION_ORDER: readonly MuscleSection[] = [
  "push",
  "pull",
  "legs",
  "core",
  "rehab",
];

export const MUSCLE_SECTION_LABELS: Record<MuscleSection, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  core: "Core",
  rehab: "Rehab and accessory",
};

export interface MuscleGroupDef {
  /** Stable key, written to frontmatter. */
  id: MuscleGroup;
  /** Display text. Casing lives here, not in a CSS transform. */
  label: string;
  /**
   * Tracked body parts carry a weekly target derived from the active plan and
   * render a progress bar. Untracked ones are logged and counted identically,
   * but carry no goal — abs and rehab work should read as work done, never as
   * progress against a target the user never set.
   */
  tracked: boolean;
  section: MuscleSection;
}

/**
 * `back` was one group covering everything from lats to spinal erectors, which
 * made a pull day unreadable and a weekly target meaningless. It is split in
 * two. Upper back absorbs traps, rhomboids and rear delts, which is why there
 * is no separate rear delt group and why shoulders stays whole.
 */
export const UPPER_BACK = "upper back";
export const LATS_LOWER_BACK = "lats and lower back";

/** The pre-split key. Still present in every session note logged before this. */
export const LEGACY_BACK = "back";

export const MUSCLE_GROUPS: readonly MuscleGroupDef[] = [
  // --- push ---
  { id: "chest", label: "Chest", tracked: true, section: "push" },
  { id: "shoulders", label: "Shoulders", tracked: true, section: "push" },
  { id: "triceps", label: "Triceps", tracked: true, section: "push" },

  // --- pull ---
  { id: UPPER_BACK, label: "Upper back", tracked: true, section: "pull" },
  {
    id: LATS_LOWER_BACK,
    label: "Lats & lower back",
    tracked: true,
    section: "pull",
  },
  { id: "biceps", label: "Biceps", tracked: true, section: "pull" },
  { id: "forearms", label: "Forearms", tracked: true, section: "pull" },

  // --- legs ---
  { id: "quads", label: "Quads", tracked: true, section: "legs" },
  { id: "hamstrings", label: "Hamstrings", tracked: true, section: "legs" },
  { id: "glutes", label: "Glutes", tracked: true, section: "legs" },
  { id: "calves", label: "Calves", tracked: true, section: "legs" },

  // --- core ---
  // Abs are loggable and counted, but carry no weekly target: direct ab work is
  // accessory, and a bar demanding twelve sets of it every week is a goal the
  // user never asked for.
  { id: "core", label: "Core", tracked: false, section: "core" },

  // --- rehab and accessory ---
  // All untracked. These are stabilisers and joint work: they belong in the log
  // and in the volume readout, never in a target.
  { id: "rotator cuff", label: "Rotator cuff", tracked: false, section: "rehab" },
  { id: "shoulder blades", label: "Shoulder blades", tracked: false, section: "rehab" },
  { id: "neck", label: "Neck", tracked: false, section: "rehab" },
  { id: "thoracic spine", label: "Thoracic spine", tracked: false, section: "rehab" },
  { id: "wrists", label: "Wrists", tracked: false, section: "rehab" },
  { id: "elbows", label: "Elbows", tracked: false, section: "rehab" },
  { id: "deep core", label: "Deep core", tracked: false, section: "rehab" },
  { id: "lower back", label: "Lower back", tracked: false, section: "rehab" },
  { id: "hips", label: "Hips", tracked: false, section: "rehab" },
  { id: "hip flexors", label: "Hip flexors", tracked: false, section: "rehab" },
  { id: "knees", label: "Knees", tracked: false, section: "rehab" },
  { id: "ankles", label: "Ankles", tracked: false, section: "rehab" },
  { id: "feet", label: "Feet", tracked: false, section: "rehab" },
  { id: "balance", label: "Balance", tracked: false, section: "rehab" },
];

const BY_ID = new Map(MUSCLE_GROUPS.map((m) => [m.id, m]));

export function findMuscle(id: MuscleGroup): MuscleGroupDef | null {
  return BY_ID.get(id) ?? null;
}

/**
 * Display text for a body part. Falls back to the raw id so a hand-edited note
 * naming something off-list still renders, rather than showing a blank row.
 */
export function muscleLabel(id: MuscleGroup): string {
  return BY_ID.get(id)?.label ?? id;
}

/**
 * Whether a body part carries a weekly target. Unknown ids are untracked: a
 * group the plugin has never heard of cannot have a goal attached to it.
 */
export function isTracked(id: MuscleGroup): boolean {
  return BY_ID.get(id)?.tracked ?? false;
}

export function trackedMuscles(): MuscleGroupDef[] {
  return MUSCLE_GROUPS.filter((m) => m.tracked);
}

export interface MuscleSectionGroup {
  section: MuscleSection;
  label: string;
  muscles: MuscleGroupDef[];
}

/**
 * The list arranged for a picker: tracked training groups first, rehab and
 * accessory work last. `exclude` drops body parts already on the sheet.
 */
export function muscleSections(
  exclude: ReadonlySet<MuscleGroup> = new Set(),
): MuscleSectionGroup[] {
  const out: MuscleSectionGroup[] = [];

  for (const section of MUSCLE_SECTION_ORDER) {
    const muscles = MUSCLE_GROUPS.filter(
      (m) => m.section === section && !exclude.has(m.id),
    );
    if (muscles.length > 0) {
      out.push({ section, label: MUSCLE_SECTION_LABELS[section], muscles });
    }
  }

  return out;
}

/** Sort key so every list of body parts comes out in canonical order. */
export function muscleRank(id: MuscleGroup): number {
  const index = MUSCLE_GROUPS.findIndex((m) => m.id === id);
  // Off-list groups sort last rather than first, so a typo in a hand-edited
  // note does not push itself to the top of the stats page.
  return index === -1 ? MUSCLE_GROUPS.length : index;
}

/**
 * Splits a pre-split `back` count across the two groups that replaced it.
 *
 * Even split, with the odd set going to upper back. Ten logged back sets become
 * five and five; seven become four and three. Total volume is preserved exactly,
 * which is the whole requirement — a user's all time back number must not move
 * because the plugin changed its mind about categories.
 */
export function splitLegacyBack(count: number): {
  [UPPER_BACK]: number;
  [LATS_LOWER_BACK]: number;
} {
  const upper = Math.ceil(count / 2);
  return { [UPPER_BACK]: upper, [LATS_LOWER_BACK]: count - upper };
}

/**
 * Rewrites a set record so legacy `back` becomes the two new groups.
 *
 * Applied at read time rather than by rewriting notes on disk: nothing is
 * destroyed, it works the moment the plugin updates, and a user who never opens
 * settings still sees correct history. Notes keep saying `back` until they ask
 * for the on-disk repair.
 */
export function migrateSets(
  sets: Record<MuscleGroup, number>,
): Record<MuscleGroup, number> {
  const legacy = sets[LEGACY_BACK];
  if (typeof legacy !== "number" || legacy <= 0) return sets;

  const { [LEGACY_BACK]: _dropped, ...rest } = sets;
  const split = splitLegacyBack(legacy);

  // Additive, so a note that somehow carries both the old and new keys ends up
  // with the sum rather than losing one of them.
  return {
    ...rest,
    [UPPER_BACK]: (rest[UPPER_BACK] ?? 0) + split[UPPER_BACK],
    [LATS_LOWER_BACK]: (rest[LATS_LOWER_BACK] ?? 0) + split[LATS_LOWER_BACK],
  };
}

import { planTemplates, type Plan } from "./plans";
import { isTracked, muscleRank, type MuscleGroup } from "./muscles";
import { Template } from "./templates";

/**
 * Weekly volume targets are derived from the active plan, never hardcoded
 * (spec §3). A fixed 10-12 set target would render a perfectly executed week as
 * failure on almost every muscle, which is the opposite of the intended feeling.
 *
 * The target is simply what the plan delivers when you do all of it, so a
 * completed week fills every bar — whichever plan you are on. There is no
 * tolerance band: the readout is a proportion now, not a pass/fail, so there is
 * nothing left for a band to decide.
 */
export interface VolumeTarget {
  muscle: MuscleGroup;
  /** What the plan's required sessions deliver across the week. */
  target: number;
}

export function deriveVolumeTargets(
  plan: Plan,
  templates: readonly Template[],
): VolumeTarget[] {
  const totals: Record<MuscleGroup, number> = {};

  // planTemplates repeats entries, so a plan with two push days counts its
  // chest volume twice — which is the whole point of a derived target.
  for (const template of planTemplates(plan, templates)) {
    for (const [muscle, count] of Object.entries(template.sets)) {
      // Zero-set entries are offers on the sheet, not part of the plan's ask.
      if (count <= 0) continue;
      totals[muscle] = (totals[muscle] ?? 0) + count;
    }
  }

  return Object.entries(totals)
    .map(([muscle, target]) => ({ muscle, target }))
    .sort((a, b) => muscleRank(a.muscle) - muscleRank(b.muscle));
}

/**
 * Only tracked body parts carry a goal. Abs and rehab work are logged and
 * counted identically, but a bar demanding three sets of core every week is a
 * target the user never set.
 */
export function trackedTargets(
  plan: Plan,
  templates: readonly Template[],
): VolumeTarget[] {
  return deriveVolumeTargets(plan, templates).filter((t) => isTracked(t.muscle));
}

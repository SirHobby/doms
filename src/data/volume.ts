import { planTemplates, type Plan } from "./plans";
import { MuscleGroup, Template } from "./templates";

/**
 * Weekly volume targets are derived from the active plan, never hardcoded
 * (spec §3). A fixed 10-12 set target would render a perfectly executed week as
 * failure on almost every muscle, which is the opposite of the intended feeling.
 */
export interface VolumeTarget {
  muscle: MuscleGroup;
  /** What the three required sessions deliver. */
  target: number;
  min: number;
  max: number;
}

export const DEFAULT_TOLERANCE = 0.15;

/**
 * A pure percentage band collapses on small numbers: the default plan gives
 * biceps 2 sets, and ±15% of 2 is 1.7-2.3, so 2 is the only integer that
 * passes and any deviation reads as failure. The floor keeps the band at least
 * one set wide in each direction.
 */
export const MIN_BAND_SETS = 1;

export function deriveVolumeTargets(
  plan: Plan,
  templates: readonly Template[],
  tolerance: number = DEFAULT_TOLERANCE,
): VolumeTarget[] {
  const totals: Record<MuscleGroup, number> = {};

  // planTemplates repeats entries, so a plan with two push days counts its
  // chest volume twice — which is the whole point of the derived band.
  for (const template of planTemplates(plan, templates)) {
    for (const [muscle, count] of Object.entries(template.sets)) {
      totals[muscle] = (totals[muscle] ?? 0) + count;
    }
  }

  return Object.entries(totals)
    .map(([muscle, target]) => {
      const band = Math.max(MIN_BAND_SETS, target * tolerance);
      return {
        muscle,
        target,
        min: Math.max(0, Math.round((target - band) * 10) / 10),
        max: Math.round((target + band) * 10) / 10,
      };
    })
    .sort((a, b) => b.target - a.target || a.muscle.localeCompare(b.muscle));
}

export function isWithinBand(target: VolumeTarget, delivered: number): boolean {
  return delivered >= target.min && delivered <= target.max;
}

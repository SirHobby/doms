/**
 * Days the user built themselves.
 *
 * The custom routine prescribes nothing, which makes logging the same workout
 * twice a week of retyping: pick the body parts, count, repeat. A created day is
 * that choice saved once — a name and a set of body parts with suggested counts,
 * offered on the Week tab as a one tap workout like any prescribed one.
 *
 * They live in settings rather than in the vault. A template is configuration,
 * not training history: nothing about it belongs in a folder the user reads, and
 * deleting one must never touch the sessions logged under it.
 */

import type { MuscleGroup } from "./muscles";
import type { Template } from "./templates";

export interface CustomDay {
  /**
   * Written straight into session frontmatter as `template:`, so it is a
   * readable slug rather than a number. Stable across renames — the sessions
   * already logged under it must keep resolving.
   */
  id: string;
  name: string;
  /** Body part -> suggested set count. */
  sets: Record<MuscleGroup, number>;
}

/** What a body part starts at when you add it to a day. */
export const DEFAULT_DAY_SETS = 3;

export const MAX_DAY_NAME = 40;

/**
 * Ids are namespaced so a created day can never collide with a built-in
 * template — a day called "Push" must not shadow the real push template, in the
 * plugin or in a Dataview query.
 */
export const CUSTOM_DAY_PREFIX = "day-";

export function isCustomDayId(id: string): boolean {
  return id.startsWith(CUSTOM_DAY_PREFIX);
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "day";
}

/** A readable id, suffixed only as far as it takes to be unique. */
export function makeDayId(name: string, taken: ReadonlySet<string>): string {
  const base = `${CUSTOM_DAY_PREFIX}${slugify(name)}`;
  if (!taken.has(base)) return base;

  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * A created day, as the rest of the plugin sees it. `userDefined` is what keeps
 * these out of the bonus offers on prescribed routines: they belong to the
 * custom plan, not to every plan.
 */
export function dayTemplate(day: CustomDay): Template {
  return {
    id: day.id,
    name: day.name,
    kind: "strength",
    sets: { ...day.sets },
    userDefined: true,
  };
}

export function daySetTotal(day: CustomDay): number {
  let total = 0;
  for (const count of Object.values(day.sets)) total += count;
  return total;
}

/**
 * Created days arrive from disk as untrusted JSON, same as everything else in
 * data.json. A malformed entry is dropped rather than repaired: a day the user
 * cannot have created is not a day worth reconstructing.
 */
export function normalizeCustomDays(raw: unknown): CustomDay[] {
  if (!Array.isArray(raw)) return [];

  const out: CustomDay[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const day = normalizeDay(entry);
    if (!day || seen.has(day.id)) continue;
    seen.add(day.id);
    out.push(day);
  }
  return out;
}

function normalizeDay(raw: unknown): CustomDay | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  if (typeof data.id !== "string" || !isCustomDayId(data.id)) return null;
  if (typeof data.name !== "string" || !data.name.trim()) return null;

  const sets: Record<MuscleGroup, number> = {};
  if (data.sets && typeof data.sets === "object") {
    for (const [muscle, count] of Object.entries(
      data.sets as Record<string, unknown>,
    )) {
      if (typeof count === "number" && Number.isInteger(count) && count >= 0) {
        sets[muscle] = count;
      }
    }
  }

  // A day with no body parts on it cannot be logged and cannot be edited back
  // into usefulness from the week page, so it is not kept.
  if (Object.keys(sets).length === 0) return null;

  return {
    id: data.id,
    name: data.name.trim().slice(0, MAX_DAY_NAME),
    sets,
  };
}

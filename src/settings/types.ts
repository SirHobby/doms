import { Platform } from "obsidian";
import { DEFAULT_WEEK_START, isWeekDay, WeekDay } from "../data/dates";
import { DEFAULT_ROOT_FOLDER, normalizeRoot } from "../data/paths";
import { DEFAULT_PLAN_ID, PLANS } from "../data/plans";

/**
 * Accent presets from spec §6. "inherit" is the default and is represented as
 * the *absence* of a data-doms-theme attribute, so the user's theme and any CSS
 * snippets keep working untouched.
 */
export const ACCENT_PRESETS = [
  "magenta",
  "violet",
  "teal",
  "coral",
  "blue",
  "amber",
] as const;

export type AccentPreset = (typeof ACCENT_PRESETS)[number];

export type AccentSetting = "inherit" | AccentPreset;

export const ACCENT_LABELS: Record<AccentSetting, string> = {
  inherit: "Inherit from theme",
  magenta: "Magenta",
  violet: "Violet",
  teal: "Teal",
  coral: "Coral",
  blue: "Blue",
  amber: "Amber",
};

/**
 * Spec §8 lists this as "compact / full (defaults by platform)". It is stored
 * as three values rather than two so that a desktop user picking "full" does
 * not push a five row banner onto their 360px phone through vault sync.
 */
export type TitleSize = "auto" | "compact" | "full";

export type ResolvedTitleSize = "compact" | "full";

export const TITLE_SIZE_LABELS: Record<TitleSize, string> = {
  auto: "Auto (compact on mobile)",
  compact: "Compact (3 rows)",
  full: "Full (5 rows)",
};

/** Spec §8. Remote sources are a later phase. */
export type CelebrationMode = "animation" | "folder";

export const CELEBRATION_MODE_LABELS: Record<CelebrationMode, string> = {
  animation: "Animation only",
  folder: "Images from a vault folder",
};

export interface DomsSettings {
  /** Appearance */
  accent: AccentSetting;
  asciiTitles: boolean;
  titleSize: TitleSize;

  /** Plan */
  planId: string;
  weekStart: WeekDay;

  /** Celebration */
  celebrationMode: CelebrationMode;
  celebrationFolder: string;

  /** Storage */
  rootFolder: string;
}

export const DEFAULT_SETTINGS: DomsSettings = {
  accent: "inherit",
  asciiTitles: true,
  titleSize: "auto",
  planId: DEFAULT_PLAN_ID,
  weekStart: DEFAULT_WEEK_START,
  celebrationMode: "animation",
  celebrationFolder: "",
  rootFolder: DEFAULT_ROOT_FOLDER,
};

export function resolveTitleSize(settings: DomsSettings): ResolvedTitleSize {
  if (settings.titleSize === "auto") {
    return Platform.isMobile ? "compact" : "full";
  }
  return settings.titleSize;
}

/**
 * Settings arrive from disk as untrusted JSON. Merging key by key means an old
 * or hand-edited data.json cannot inject a bad value that later phases would
 * have to defend against.
 */
export function normalizeSettings(raw: unknown): DomsSettings {
  const data = (raw ?? {}) as Partial<Record<keyof DomsSettings, unknown>>;
  const accent = data.accent;
  const titleSize = data.titleSize;

  return {
    accent:
      accent === "inherit" ||
      (ACCENT_PRESETS as readonly unknown[]).includes(accent)
        ? (accent as AccentSetting)
        : DEFAULT_SETTINGS.accent,
    asciiTitles:
      typeof data.asciiTitles === "boolean"
        ? data.asciiTitles
        : DEFAULT_SETTINGS.asciiTitles,
    titleSize:
      titleSize === "auto" || titleSize === "compact" || titleSize === "full"
        ? titleSize
        : DEFAULT_SETTINGS.titleSize,
    planId:
      typeof data.planId === "string" && PLANS.some((p) => p.id === data.planId)
        ? data.planId
        : DEFAULT_SETTINGS.planId,
    weekStart: isWeekDay(data.weekStart)
      ? data.weekStart
      : DEFAULT_SETTINGS.weekStart,
    celebrationMode:
      data.celebrationMode === "folder" ? "folder" : "animation",
    celebrationFolder:
      typeof data.celebrationFolder === "string"
        ? data.celebrationFolder.trim()
        : DEFAULT_SETTINGS.celebrationFolder,
    rootFolder:
      typeof data.rootFolder === "string" && data.rootFolder.trim().length > 0
        ? normalizeRoot(data.rootFolder)
        : DEFAULT_SETTINGS.rootFolder,
  };
}

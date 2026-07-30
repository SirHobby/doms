import { App, TFile } from "obsidian";
import type { ContentVideo } from "./content-videos";
import { ideasFolder, rehabFolder } from "./paths";
import { markdownFilesIn } from "./vault-files";

export type ContentCategory = "ideas" | "rehab";

export interface ContentExercise {
  name: string;
  note: string;
  /** Verified YouTube references. The only links in the library. */
  videos: ContentVideo[];
}

export interface ContentNote {
  file: TFile;
  category: ContentCategory;
  /** Picker grouping, e.g. "push". Free text; unknown groups sort last. */
  group: string;
  slug: string;
  label: string;
  subtitle: string | null;
  /** Rendered as a distinct callout above the list, not as body text. */
  caution: string | null;
  note: string | null;
  videos: ContentVideo[];
  exercises: ContentExercise[];
}

export function categoryFolder(root: string, category: ContentCategory): string {
  return category === "ideas" ? ideasFolder(root) : rehabFolder(root);
}

/** Display order for the picker. Anything unlisted sorts after these. */
export const GROUP_ORDER = [
  "push",
  "pull",
  "legs",
  "core",
  "upper",
  "spine",
  "lower",
  "whole body",
  "other",
];

export const GROUP_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  core: "Core",
  upper: "Upper body",
  spine: "Spine and core",
  lower: "Lower body",
  "whole body": "Whole body",
  other: "Other",
};

export function groupRank(group: string): number {
  const index = GROUP_ORDER.indexOf(group);
  return index === -1 ? GROUP_ORDER.length : index;
}

export function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? toLabel(group);
}

/**
 * Only http(s) survives. These strings come from files in the vault, which the
 * user (or anything that can write to the vault) controls, so a `javascript:`
 * URL must never reach an anchor element.
 */
export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function videoUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

function parseVideos(raw: unknown): ContentVideo[] {
  if (!Array.isArray(raw)) return [];

  const videos: ContentVideo[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    // A bare id only. Anything else is a scrape artefact or a pasted URL.
    if (!VIDEO_ID.test(id)) continue;

    videos.push({
      id,
      title: str(item.title) ?? id,
      // Attribution is not optional on a third party link.
      source: str(item.source) ?? "Unknown",
    });
  }
  return videos;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Exercises live in frontmatter arrays rather than markdown list lines. There
 * is nothing to parse, so names containing parentheses, dashes or slashes stop
 * being a problem — and the whole library is queryable with Dataview for free.
 */
function parseExercises(raw: unknown): ContentExercise[] {
  if (!Array.isArray(raw)) return [];

  const exercises: ContentExercise[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const name = str(item.name);
    if (!name) continue;

    exercises.push({
      name,
      note: str(item.note) ?? "",
      videos: parseVideos(item.videos),
    });
  }
  return exercises;
}

export function toLabel(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

/**
 * Reads the content notes for one category. Everything comes from the metadata
 * cache; no file body is parsed.
 */
export function loadContent(
  app: App,
  root: string,
  category: ContentCategory,
): ContentNote[] {
  const notes: ContentNote[] = [];

  for (const file of markdownFilesIn(app, categoryFolder(root, category))) {
    const fm: Record<string, unknown> | undefined =
      app.metadataCache.getFileCache(file)?.frontmatter;
    // Tolerate a missing marker: anything the user drops in the folder counts.
    if (fm?.doms && fm.doms !== "content") continue;

    const slug = str(fm?.slug) ?? file.basename;

    notes.push({
      file,
      category,
      group: str(fm?.group) ?? "other",
      slug,
      label: str(fm?.title) ?? toLabel(slug),
      subtitle: str(fm?.subtitle),
      caution: str(fm?.caution),
      note: str(fm?.note),
      videos: parseVideos(fm?.videos),
      exercises: parseExercises(fm?.exercises),
    });
  }

  return notes.sort(
    (a, b) =>
      groupRank(a.group) - groupRank(b.group) ||
      a.group.localeCompare(b.group) ||
      a.label.localeCompare(b.label),
  );
}

export interface ContentGroup {
  group: string;
  label: string;
  notes: ContentNote[];
}

/** Twenty-one categories will not fit one pill row, so the picker groups them. */
export function groupNotes(notes: readonly ContentNote[]): ContentGroup[] {
  const groups = new Map<string, ContentNote[]>();
  for (const note of notes) {
    const list = groups.get(note.group);
    if (list) list.push(note);
    else groups.set(note.group, [note]);
  }

  return [...groups.entries()]
    .map(([group, list]) => ({ group, label: groupLabel(group), notes: list }))
    .sort((a, b) => groupRank(a.group) - groupRank(b.group));
}

import { App, TFile, TFolder, normalizePath } from "obsidian";
import { categoryFolder, type ContentCategory } from "./content";
import type { ContentVideo } from "./content-videos";
import { SEED_IDEAS } from "./seed-ideas";
import { SEED_REHAB } from "./seed-rehab";
import type { SeedNote } from "./seed-types";
import { withVideos } from "./seed-videos";

export type { SeedExercise, SeedNote } from "./seed-types";

export const STARTER_CONTENT: readonly SeedNote[] = withVideos([
  ...SEED_IDEAS,
  ...SEED_REHAB,
]);

/**
 * Slugs this plugin shipped in earlier versions and no longer does.
 *
 * They cannot simply be inferred from "not in STARTER_CONTENT", because that
 * would also match notes the user wrote themselves. Listing them explicitly
 * means cleanup only ever touches files D.O.M.S created.
 *
 * Left behind, they show up in the picker under "Other" with nothing in them:
 * the old format stored exercises as markdown bullets, which the frontmatter
 * reader sees as an empty category.
 */
export const LEGACY_SLUGS: Record<ContentCategory, readonly string[]> = {
  // "arms"/"back"/"legs" split into the per-region categories; "lats" folded
  // into upper-back; "abs" and "deep-core" merged into "core".
  ideas: ["arms", "back", "legs", "lats", "abs", "deep-core"],
  // The first rehab pass was named after injuries and used singular slugs.
  rehab: ["knee", "ankle", "hip", "low-back", "wrist", "elbow", "shin"],
};

/**
 * JSON strings are valid YAML double-quoted scalars, which sidesteps every
 * quoting question at once — colons in video titles, apostrophes, dashes.
 */
function yaml(value: string): string {
  return JSON.stringify(value);
}

function videoLines(videos: readonly ContentVideo[], indent: string): string[] {
  const lines: string[] = [];
  for (const v of videos) {
    // Bare id, never a URL: the link is built at render time.
    lines.push(`${indent}- id: ${v.id}`);
    lines.push(`${indent}  title: ${yaml(v.title)}`);
    lines.push(`${indent}  source: ${yaml(v.source)}`);
  }
  return lines;
}

function renderNote(note: SeedNote): string {
  const lines = [
    "---",
    "doms: content",
    `category: ${note.category}`,
    `group: ${yaml(note.group)}`,
    `slug: ${yaml(note.slug)}`,
    `title: ${yaml(note.title)}`,
    `subtitle: ${yaml(note.subtitle)}`,
  ];

  if (note.caution) lines.push(`caution: ${yaml(note.caution)}`);
  if (note.note) lines.push(`note: ${yaml(note.note)}`);

  if (note.videos?.length) {
    lines.push("videos:");
    lines.push(...videoLines(note.videos, "  "));
  }

  lines.push("exercises:");
  for (const exercise of note.exercises) {
    lines.push(`  - name: ${yaml(exercise.name)}`);
    lines.push(`    note: ${yaml(exercise.note)}`);
    if (exercise.videos?.length) {
      lines.push("    videos:");
      lines.push(...videoLines(exercise.videos, "      "));
    }
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "Your own notes go here. D.O.M.S reads the frontmatter above and never rewrites this file.",
  );
  lines.push("");

  return lines.join("\n");
}

export interface SeedResult {
  created: number;
  skipped: number;
  replaced: number;
  removed: number;
}

export type SeedMode = "create" | "replace";

/**
 * "create" is idempotent and never touches an existing file — a user who edited
 * a starter note keeps exactly what they wrote (spec §5, §9).
 *
 * "replace" overwrites the starter notes only, and only when the user asks for
 * it explicitly. It exists because the content format changed: notes written by
 * an earlier version store exercises as markdown bullets, which the frontmatter
 * reader sees as an empty category. Anything not in STARTER_CONTENT is still
 * left alone either way.
 */
export async function seedStarterContent(
  app: App,
  root: string,
  mode: SeedMode = "create",
): Promise<SeedResult> {
  let created = 0;
  let skipped = 0;
  let replaced = 0;
  let removed = 0;

  for (const note of STARTER_CONTENT) {
    const folder = categoryFolder(root, note.category);
    await ensureFolder(app, folder);

    const path = normalizePath(`${folder}/${note.slug}.md`);
    const existing = app.vault.getAbstractFileByPath(path);

    if (existing instanceof TFile) {
      if (mode !== "replace") {
        skipped++;
        continue;
      }
      await app.vault.modify(existing, renderNote(note));
      replaced++;
      continue;
    }
    if (existing) {
      skipped++;
      continue;
    }

    await app.vault.create(path, renderNote(note));
    created++;
  }

  if (mode === "replace") {
    removed = await removeLegacyNotes(app, root);
  }

  return { created, skipped, replaced, removed };
}

/**
 * Moves superseded starter notes to the vault trash. Trash rather than delete,
 * because the user may have added their own text to one.
 */
async function removeLegacyNotes(app: App, root: string): Promise<number> {
  const current = new Set(
    STARTER_CONTENT.map((n) => `${n.category}/${n.slug}`),
  );

  let removed = 0;
  for (const category of ["ideas", "rehab"] as ContentCategory[]) {
    const folder = categoryFolder(root, category);
    for (const slug of LEGACY_SLUGS[category]) {
      // Never remove a slug the library still ships.
      if (current.has(`${category}/${slug}`)) continue;

      const file = app.vault.getAbstractFileByPath(
        normalizePath(`${folder}/${slug}.md`),
      );
      if (file instanceof TFile) {
        await app.fileManager.trashFile(file);
        removed++;
      }
    }
  }
  return removed;
}

async function ensureFolder(app: App, path: string): Promise<void> {
  let current = "";
  for (const part of normalizePath(path).split("/")) {
    current = current ? `${current}/${part}` : part;
    const existing = app.vault.getAbstractFileByPath(current);
    if (existing instanceof TFolder) continue;
    if (existing) throw new Error(`D.O.M.S: ${current} exists but is not a folder.`);
    await app.vault.createFolder(current);
  }
}

export { renderNote };

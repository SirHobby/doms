import { App, TFile, normalizePath } from "obsidian";

/**
 * Tier two celebration (spec §4.3): the user points a setting at a vault folder
 * of their own images or gifs, and one is picked at random per session.
 *
 * Community plugins ship only main.js, manifest.json and styles.css, so binary
 * assets cannot be bundled — anything visual beyond tier one has to come from
 * the vault.
 */
const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "svg",
]);

export function celebrationImages(app: App, folder: string): TFile[] {
  const trimmed = folder.trim();
  if (!trimmed) return [];

  const prefix = `${normalizePath(trimmed.replace(/^\/+|\/+$/g, ""))}/`;
  return app.vault
    .getFiles()
    .filter(
      (file) =>
        file.path.startsWith(prefix) &&
        IMAGE_EXTENSIONS.has(file.extension.toLowerCase()),
    );
}

/**
 * A resource URL for a random image, or null. Null is not an error: the caller
 * falls back to the tier one animation, which never fails.
 */
export function pickCelebrationImage(
  app: App,
  folder: string,
): string | null {
  const files = celebrationImages(app, folder);
  if (files.length === 0) return null;

  const file = files[Math.floor(Math.random() * files.length)];
  return app.vault.getResourcePath(file);
}

import { App, TFile, TFolder, normalizePath } from "obsidian";

/**
 * Files inside one folder, without enumerating the vault.
 *
 * `vault.getMarkdownFiles()` returns every note in the vault and then filters by
 * path prefix, which means the plugin touches file paths it has no business
 * seeing. Walking down from the folder itself reads only what it needs, and is
 * cheaper in a large vault besides.
 */
export function filesIn(
  app: App,
  folderPath: string,
  extension?: string,
): TFile[] {
  const root = app.vault.getAbstractFileByPath(normalizePath(folderPath));
  if (!(root instanceof TFolder)) return [];

  const found: TFile[] = [];
  const pending: TFolder[] = [root];

  while (pending.length > 0) {
    const folder = pending.pop();
    if (!folder) continue;

    for (const child of folder.children) {
      if (child instanceof TFolder) {
        pending.push(child);
      } else if (child instanceof TFile) {
        if (!extension || child.extension.toLowerCase() === extension) {
          found.push(child);
        }
      }
    }
  }

  return found;
}

export function markdownFilesIn(app: App, folderPath: string): TFile[] {
  return filesIn(app, folderPath, "md");
}

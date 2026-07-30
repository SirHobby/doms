import { normalizePath } from "obsidian";

export const DEFAULT_ROOT_FOLDER = "DOMS";

/**
 * Users type root folder paths by hand, so strip the things they get wrong:
 * leading and trailing slashes, whitespace, and an empty value.
 */
export function normalizeRoot(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return normalizePath(trimmed.length > 0 ? trimmed : DEFAULT_ROOT_FOLDER);
}

export function logFolder(root: string): string {
  return normalizePath(`${normalizeRoot(root)}/log`);
}

export function contentFolder(root: string): string {
  return normalizePath(`${normalizeRoot(root)}/content`);
}

export function ideasFolder(root: string): string {
  return normalizePath(`${contentFolder(root)}/ideas`);
}

export function rehabFolder(root: string): string {
  return normalizePath(`${contentFolder(root)}/rehab`);
}

/**
 * Session filenames are the ISO date, with a numeric suffix on collision
 * (spec §5). Index 1 is the bare date.
 */
export function sessionFileName(dateIso: string, index: number): string {
  return index <= 1 ? `${dateIso}.md` : `${dateIso}-${index}.md`;
}

export function sessionPath(
  root: string,
  dateIso: string,
  index: number,
): string {
  return normalizePath(`${logFolder(root)}/${sessionFileName(dateIso, index)}`);
}

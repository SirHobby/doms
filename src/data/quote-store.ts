import { App, TFile, normalizePath } from "obsidian";
import { normalizeRoot } from "./paths";
import { QUOTES, type Quote, type QuoteCategory } from "./quotes";

/**
 * The quote bank, overridable from the vault.
 *
 * The built-in list is short-form quotation. Longer excerpts of film, anime and
 * game dialogue start to look like reproduced script rather than quotation,
 * which matters for community plugin review — so the bank is editable as a
 * plain JSON file the user owns. Drop a file here and it replaces the built-in
 * list wholesale; delete it and the built-in list comes back.
 */
export const QUOTES_FILENAME = "motivation.json";

export function quotesPath(root: string): string {
  return normalizePath(`${normalizeRoot(root)}/${QUOTES_FILENAME}`);
}

const CATEGORIES: readonly QuoteCategory[] = [
  "lifting",
  "combat",
  "anime",
  "games",
];

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Skips malformed entries rather than throwing: one bad line is not fatal. */
export function parseQuoteBank(raw: string): Quote[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const quotes: Quote[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;

    // "quote" is accepted as an alias for "text" — it is the more natural key
    // to write by hand, and both show up in exported banks.
    const text = str(item.text) ?? str(item.quote);
    const author = str(item.author);
    if (!text || !author) continue;

    const category = str(item.category) as QuoteCategory | null;

    quotes.push({
      text,
      author,
      long: str(item.long) ?? undefined,
      source: str(item.source) ?? undefined,
      category:
        category && CATEGORIES.includes(category) ? category : "lifting",
    });
  }
  return quotes;
}

/** The vault bank if there is a usable one, otherwise the built-in list. */
export async function loadQuoteBank(
  app: App,
  root: string,
): Promise<readonly Quote[]> {
  const file = app.vault.getAbstractFileByPath(quotesPath(root));
  if (!(file instanceof TFile)) return QUOTES;

  try {
    const parsed = parseQuoteBank(await app.vault.cachedRead(file));
    return parsed.length > 0 ? parsed : QUOTES;
  } catch {
    return QUOTES;
  }
}

export function serializeQuoteBank(quotes: readonly Quote[]): string {
  return `${JSON.stringify(quotes, null, 2)}\n`;
}

/** Writes the current bank out so the user can edit or replace it. */
export async function exportQuoteBank(
  app: App,
  root: string,
): Promise<{ path: string; count: number }> {
  const path = quotesPath(root);
  const body = serializeQuoteBank(QUOTES);

  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) await app.vault.modify(existing, body);
  else await app.vault.create(path, body);

  return { path, count: QUOTES.length };
}

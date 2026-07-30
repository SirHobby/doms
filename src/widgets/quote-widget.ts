import { setIcon } from "obsidian";
import {
  QUOTES,
  quoteOfTheDay,
  resolveCategory,
  type Quote,
  type QuoteCategory,
} from "../data/quotes";
import { iconNamesForQuote } from "../ui/quote-icon";
import { bool, type WidgetSource } from "./options";

export interface QuoteOptions {
  category: QuoteCategory | null;
  /** Tapping rerolls. Off by default so the daily quote stays daily. */
  reroll: boolean;
  icon: boolean;
}

export function quoteOptions(source: WidgetSource): QuoteOptions {
  return {
    category: resolveCategory(source.category),
    reroll: bool(source, "reroll", false),
    icon: bool(source, "icon", true),
  };
}

export interface QuoteInput {
  bank: readonly Quote[];
  options: QuoteOptions;
  /** Overrides the daily pick, for an explicit reroll. */
  quote?: Quote | null;
}

/**
 * One quote, the same all day.
 *
 * The daily pick is date-seeded rather than random, which buys stability across
 * repaints, the same quote on phone and desktop with nothing synced, a rollover
 * at midnight with no timer, and no writes to data.json.
 */
export function renderQuoteWidget(
  containerEl: HTMLElement,
  input: QuoteInput,
  onReroll?: () => void,
): void {
  containerEl.empty();

  const quote =
    input.quote ?? quoteOfTheDay(input.bank, input.options.category ?? undefined);

  const root = containerEl.createDiv({ cls: "doms-widget-quote" });

  if (!quote) {
    // Only reachable if a category filters the bank to nothing.
    root.createDiv({
      cls: "doms-widget-empty",
      text: "No quotes match that category.",
    });
    return;
  }

  if (input.options.icon) {
    const icon = root.createDiv({ cls: "doms-widget-quote-icon" });
    icon.setAttribute("aria-hidden", "true");
    for (const name of iconNamesForQuote(quote)) {
      icon.empty();
      setIcon(icon, name);
      if (icon.querySelector("svg")) break;
    }
  }

  const body = root.createDiv({ cls: "doms-widget-quote-body" });
  body.createDiv({ cls: "doms-widget-quote-text", text: `“${quote.text}”` });
  body.createDiv({
    cls: "doms-widget-quote-author",
    text: quote.source ? `${quote.author} · ${quote.source}` : quote.author,
  });

  if (input.options.reroll && onReroll) {
    const button = root.createEl("button", {
      cls: "doms-widget-reroll",
      text: "Another",
    });
    button.type = "button";
    button.addEventListener("click", onReroll);
  }
}

export function dailyQuote(
  bank: readonly Quote[] = QUOTES,
  category: QuoteCategory | null = null,
): Quote | null {
  return quoteOfTheDay(bank, category ?? undefined);
}

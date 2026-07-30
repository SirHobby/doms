import { Modal } from "obsidian";
import { pickQuote, quoteText, QUOTES, type Quote } from "../data/quotes";
import { loadQuoteBank } from "../data/quote-store";
import type DomsPlugin from "../main";
import { renderQuoteIcon } from "./quote-icon";

/**
 * "Need motivation?" — an icon in a badge that breaks out of the top of the
 * dialog, then the quote, its attribution, and two ways out.
 *
 * Scoped under .doms-view so it picks up the plugin's accent, since a modal is
 * rendered outside the view's DOM.
 */
export class MotivationModal extends Modal {
  private badgeEl: HTMLElement | null = null;
  private iconEl: HTMLElement | null = null;
  private quoteEl: HTMLElement | null = null;
  private authorEl: HTMLElement | null = null;

  /** Starts on the built-in list, swaps in the vault bank once it has loaded. */
  private bank: readonly Quote[] = QUOTES;

  constructor(private readonly plugin: DomsPlugin) {
    super(plugin.app);
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("doms-view");
    modalEl.addClass("doms-motivation");

    // Sits half outside the dialog, so it is a sibling of the body rather than
    // part of its flow.
    this.badgeEl = contentEl.createDiv({ cls: "doms-motivation-badge" });
    this.iconEl = this.badgeEl.createDiv({ cls: "doms-motivation-icon" });
    // Decorative: the quote below carries the meaning.
    this.iconEl.setAttribute("aria-hidden", "true");

    const body = contentEl.createDiv({ cls: "doms-motivation-body" });
    this.quoteEl = body.createDiv({ cls: "doms-motivation-quote" });
    this.quoteEl.setAttribute("role", "status");

    body.createDiv({ cls: "doms-motivation-rule" });
    this.authorEl = body.createDiv({ cls: "doms-motivation-author" });

    const actions = contentEl.createDiv({ cls: "doms-motivation-actions" });

    const another = actions.createEl("button", {
      cls: "doms-button doms-button-secondary",
      text: "Another",
    });
    another.type = "button";
    another.addEventListener("click", () => this.paint());

    const done = actions.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: "Let's go",
    });
    done.type = "button";
    done.addEventListener("click", () => this.close());

    this.paint();
    done.focus();

    void loadQuoteBank(this.plugin.app, this.plugin.settings.rootFolder).then(
      (bank) => {
        this.bank = bank;
      },
    );
  }

  private paint(): void {
    const quote: Quote = pickQuote(this.bank);

    if (this.iconEl) renderQuoteIcon(this.iconEl, quote);

    this.quoteEl?.setText(`“${quoteText(quote)}”`);
    this.authorEl?.setText(
      quote.source ? `${quote.author} · ${quote.source}` : quote.author,
    );
  }

  onClose(): void {
    this.contentEl.empty();
    this.modalEl.removeClass("doms-view");
    this.modalEl.removeClass("doms-motivation");
  }
}

import { Component } from "obsidian";

export interface PreviousCardOptions {
  onOpen: () => void;
}

/**
 * "Log a previous workout" — the way back into a week that has already closed.
 *
 * Every logging sheet carries a date, so backdating was always possible, but
 * only if you first tapped an *open* slot. A workout you finished last week is
 * shown as a completed card in a week you can no longer reach, which left the
 * one case this is for — you forgot to log it — with no route at all.
 *
 * Deliberately last on the page and deliberately quiet: it is a correction
 * affordance, not a way to log today's session.
 */
export class PreviousCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: PreviousCardOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-previous" });
    this.register(() => root.detach());

    const card = root.createEl("button", { cls: "doms-bonus-card" });
    card.type = "button";
    card.createSpan({
      cls: "doms-bonus-title",
      text: "Log a previous workout",
    });
    card.createSpan({
      cls: "doms-bonus-hint",
      text: "Miss a log last week? Log it here.",
    });

    this.registerDomEvent(card, "click", () => this.options.onOpen());
  }
}

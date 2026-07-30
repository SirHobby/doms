import { Component } from "obsidian";
import { DAY_NAMES, dayOfWeek } from "../../data/dates";
import { templateTotal, type Template } from "../../data/templates";
import type { SlotState } from "../../data/types";

export interface SlotCardOptions {
  slot: SlotState;
  template: Template | null;
  /** Copy for the time pressure nudge, when this is the suggested slot. */
  nudge: string | null;
  onOpen: (templateId: string) => void;
}

/**
 * One of the three required slots. Completed slots collapse to a single line
 * with the day and set total (spec §4.1) — the decision is already made, so it
 * stops taking up space.
 */
export class SlotCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: SlotCardOptions,
  ) {
    super();
  }

  onload(): void {
    const { slot } = this.options;
    if (slot.done) this.renderDone();
    else this.renderOpen();
  }

  private renderDone(): void {
    const { slot } = this.options;
    const session = slot.session;

    const row = this.parent.createDiv({ cls: "doms-slot doms-slot-done" });
    this.register(() => row.detach());

    row.createSpan({ cls: "doms-slot-check", text: "✓" });
    row.createSpan({ cls: "doms-slot-name", text: slot.name });

    if (session) {
      const day = DAY_NAMES[dayOfWeek(session.date)];
      row.createSpan({
        cls: "doms-slot-meta",
        text: `${day} · ${session.totalSets} sets`,
      });
    }
  }

  private renderOpen(): void {
    const { slot, template, nudge } = this.options;

    const card = this.parent.createEl("button", {
      cls: "doms-slot doms-slot-open",
    });
    card.type = "button";
    card.toggleClass("is-suggested", nudge !== null);
    this.register(() => card.detach());

    card.createSpan({ cls: "doms-slot-name", text: slot.name });

    if (template) {
      card.createSpan({
        cls: "doms-slot-meta",
        text: `${templateTotal(template)} sets`,
      });
    }

    if (nudge) {
      card.createSpan({ cls: "doms-slot-nudge", text: nudge });
    }

    this.registerDomEvent(card, "click", () =>
      this.options.onOpen(slot.templateId),
    );
  }
}

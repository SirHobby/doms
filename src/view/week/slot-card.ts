import { Component } from "obsidian";
import { DAY_NAMES, dayOfWeek } from "../../data/dates";
import { draftTotal, type SessionDraft } from "../../data/drafts";
import { templateTotal, type Template } from "../../data/templates";
import type { SlotState } from "../../data/types";

export interface SlotCardOptions {
  slot: SlotState;
  template: Template | null;
  /** Copy for the time pressure nudge, when this is the suggested slot. */
  nudge: string | null;
  /** A session counted but not yet logged, if the user walked away mid-workout. */
  draft?: SessionDraft | null;
  onOpen: (templateId: string) => void;
  onDiscard?: (draft: SessionDraft) => void;
}

/**
 * One of the required slots. Completed slots collapse to a single line with the
 * day and set total (spec §4.1) — the decision is already made, so it stops
 * taking up space.
 *
 * A slot with a draft against it sits between the two: not done, but not
 * untouched either, and the card has to say so. Otherwise coming back to the
 * week after a set looks identical to never having started, and the honest
 * assumption is that the counting was lost.
 */
export class SlotCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: SlotCardOptions,
  ) {
    super();
  }

  onload(): void {
    const { slot, draft } = this.options;
    if (slot.done) this.renderDone();
    else if (draft) this.renderInProgress(draft);
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

  /**
   * Continue is the primary action and the whole card taps through to it, so
   * picking a workout back up costs one tap wherever your thumb lands. Discard
   * is deliberately small and separate: it throws away work.
   */
  private renderInProgress(draft: SessionDraft): void {
    const { slot } = this.options;

    const card = this.parent.createDiv({
      cls: "doms-slot doms-slot-open is-progress",
    });
    this.register(() => card.detach());

    card.createSpan({ cls: "doms-slot-name", text: slot.name });

    const total = draftTotal(draft);
    card.createSpan({
      cls: "doms-slot-meta",
      text: total > 0 ? `In progress · ${total} sets` : "In progress",
    });

    const actions = card.createDiv({ cls: "doms-slot-actions" });

    const resume = actions.createEl("button", {
      cls: "doms-button doms-button-primary doms-button-small",
      text: "Continue",
    });
    resume.type = "button";
    this.registerDomEvent(resume, "click", () =>
      this.options.onOpen(slot.templateId),
    );

    const discard = actions.createEl("button", {
      cls: "doms-button doms-button-secondary doms-button-small",
      text: "Discard",
    });
    discard.type = "button";
    this.registerDomEvent(discard, "click", (event) => {
      // The card itself resumes; this button must not do both.
      event.stopPropagation();
      this.options.onDiscard?.(draft);
    });
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
      const total = templateTotal(template);
      if (total > 0) {
        card.createSpan({ cls: "doms-slot-meta", text: `${total} sets` });
      }
    }

    if (nudge) {
      card.createSpan({ cls: "doms-slot-nudge", text: nudge });
    }

    this.registerDomEvent(card, "click", () =>
      this.options.onOpen(slot.templateId),
    );
  }
}

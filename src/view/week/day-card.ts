import { Component } from "obsidian";
import { daySetTotal, type CustomDay } from "../../data/custom-days";
import { draftTotal, type SessionDraft } from "../../data/drafts";

export interface DayCardOptions {
  day: CustomDay;
  /** A session of this day counted but not yet logged. */
  draft?: SessionDraft | null;
  onOpen: (templateId: string) => void;
  onDiscard?: (draft: SessionDraft) => void;
}

/**
 * One of the user's own days on the Week tab.
 *
 * Rendered like a prescribed slot because it does the same job — tap it, count,
 * log — but it is never required. On the custom routine the bar is a number of
 * sessions, so a day you did not do this week is simply one you did not do.
 */
export class DayCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: DayCardOptions,
  ) {
    super();
  }

  onload(): void {
    const { day, draft } = this.options;

    if (draft) {
      this.renderInProgress(draft);
      return;
    }

    const card = this.parent.createEl("button", {
      cls: "doms-slot doms-slot-open",
    });
    card.type = "button";
    this.register(() => card.detach());

    card.createSpan({ cls: "doms-slot-name", text: day.name });
    card.createSpan({
      cls: "doms-slot-meta",
      text: `${daySetTotal(day)} sets`,
    });

    this.registerDomEvent(card, "click", () => this.options.onOpen(day.id));
  }

  private renderInProgress(draft: SessionDraft): void {
    const { day } = this.options;

    const card = this.parent.createDiv({
      cls: "doms-slot doms-slot-open is-progress",
    });
    this.register(() => card.detach());

    card.createSpan({ cls: "doms-slot-name", text: day.name });

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
    this.registerDomEvent(resume, "click", () => this.options.onOpen(day.id));

    const discard = actions.createEl("button", {
      cls: "doms-button doms-button-secondary doms-button-small",
      text: "Discard",
    });
    discard.type = "button";
    this.registerDomEvent(discard, "click", () =>
      this.options.onDiscard?.(draft),
    );
  }
}

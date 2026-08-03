import { Component } from "obsidian";
import { draftTotal, type SessionDraft } from "../../data/drafts";

export interface CustomCardOptions {
  /** A custom workout counted but not yet logged. */
  draft?: SessionDraft | null;
  onOpen: () => void;
  onDiscard?: (draft: SessionDraft) => void;
}

/**
 * "Log a custom workout" — the way to log anything the plan did not prescribe.
 *
 * This started life as "Log a previous workout", a date-first correction flow
 * for a session you forgot. That framing was too narrow in both directions: it
 * read as past-only, so nobody reached for it to log something unusual they had
 * just done, and it opened on a date picker, which is the wrong first question
 * when the answer is nearly always "today".
 *
 * So it is the same affordance asked the other way round. Pick the body parts
 * you trained; the date sits in the sheet header where every other sheet keeps
 * it, defaulted to today and one tap from any other day.
 */
export class CustomCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: CustomCardOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-custom" });
    this.register(() => root.detach());

    const draft = this.options.draft;
    if (draft) {
      this.renderInProgress(root, draft);
      return;
    }

    const card = root.createEl("button", { cls: "doms-bonus-card" });
    card.type = "button";
    card.createSpan({
      cls: "doms-bonus-title",
      text: "Log a custom workout",
    });
    card.createSpan({
      cls: "doms-bonus-hint",
      text: "Missed one? Did extra? Did something different?",
    });

    this.registerDomEvent(card, "click", () => this.options.onOpen());
  }

  private renderInProgress(root: HTMLElement, draft: SessionDraft): void {
    const card = root.createDiv({ cls: "doms-bonus-card is-progress" });

    card.createSpan({ cls: "doms-bonus-title", text: "Custom workout" });

    const total = draftTotal(draft);
    card.createSpan({
      cls: "doms-bonus-hint",
      text: total > 0 ? `In progress · ${total} sets` : "In progress",
    });

    const actions = card.createDiv({ cls: "doms-slot-actions" });

    const resume = actions.createEl("button", {
      cls: "doms-button doms-button-primary doms-button-small",
      text: "Continue",
    });
    resume.type = "button";
    this.registerDomEvent(resume, "click", () => this.options.onOpen());

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

export interface CreateDayCardOptions {
  onOpen: () => void;
}

/**
 * "Create a day" — custom routine only.
 *
 * A prescribed routine already has its days; this only makes sense where the
 * plugin supplies none. Last on the page because building a workout is the rare
 * action and logging one is the common one.
 */
export class CreateDayCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: CreateDayCardOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-custom" });
    this.register(() => root.detach());

    const card = root.createEl("button", { cls: "doms-bonus-card" });
    card.type = "button";
    card.createSpan({ cls: "doms-bonus-title", text: "Create a day" });
    card.createSpan({
      cls: "doms-bonus-hint",
      text: "Save a workout you repeat, so it is one tap next time.",
    });

    this.registerDomEvent(card, "click", () => this.options.onOpen());
  }
}

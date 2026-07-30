import { Component } from "obsidian";

export interface ActivitySheetOptions {
  /** Heading, e.g. "Cardio" or "A different workout". */
  title: string;
  /** Fast-path suggestions. Free text is always allowed. */
  activities: readonly string[];
  /** Text on the commit button. */
  commitText: string;
  onBack: () => void;
  onCommit: (activity: string, note: string) => Promise<void>;
}

/**
 * Sheet for "a different workout" — a bike ride, a hike, pickleball.
 *
 * No steppers: this records *that* something happened, not which muscles it
 * hit. Guessing set counts for a hike would poison the volume readout, which is
 * meant to describe gym work.
 */
export class ActivitySheet extends Component {
  private selected = "";
  private customEl: HTMLInputElement | null = null;
  private noteEl: HTMLTextAreaElement | null = null;
  private commitEl: HTMLButtonElement | null = null;
  private chips = new Map<string, HTMLButtonElement>();
  private committing = false;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: ActivitySheetOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-sheet" });
    this.register(() => root.detach());

    this.renderHeader(root);
    this.renderChips(root);
    this.renderCustom(root);
    this.renderNote(root);
    this.renderActions(root);
    this.paint();
  }

  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "doms-sheet-header" });

    const back = header.createEl("button", {
      cls: "doms-sheet-back",
      text: "← Back",
    });
    back.type = "button";
    back.setAttribute("aria-label", "Back to the week");
    this.registerDomEvent(back, "click", () => this.options.onBack());

    header.createEl("h3", { cls: "doms-sheet-title", text: this.options.title });
  }

  private renderChips(root: HTMLElement): void {
    const group = root.createDiv({ cls: "doms-chips" });
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Activity");

    for (const activity of this.options.activities) {
      const chip = group.createEl("button", {
        cls: "doms-chip",
        text: activity,
      });
      chip.type = "button";
      chip.setAttribute("aria-pressed", "false");

      this.registerDomEvent(chip, "click", () => {
        this.selected = this.selected === activity ? "" : activity;
        if (this.customEl) this.customEl.value = "";
        this.paint();
      });

      this.chips.set(activity, chip);
    }
  }

  private renderCustom(root: HTMLElement): void {
    const field = root.createEl("input", {
      cls: "doms-input",
      attr: {
        type: "text",
        placeholder: "Or type something else",
        "aria-label": "Other activity",
      },
    });
    this.customEl = field;

    this.registerDomEvent(field, "input", () => {
      // Typing wins over a chip; they are two ways to fill one value.
      if (field.value.trim()) this.selected = "";
      this.paint();
    });
  }

  private renderNote(root: HTMLElement): void {
    this.noteEl = root.createEl("textarea", {
      cls: "doms-sheet-textarea",
      attr: {
        rows: "3",
        placeholder: "Add a note about today",
        "aria-label": "Note about today",
      },
    });
  }

  private renderActions(root: HTMLElement): void {
    const actions = root.createDiv({ cls: "doms-sheet-actions" });

    const commit = actions.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: this.options.commitText,
    });
    commit.type = "button";
    this.commitEl = commit;

    this.registerDomEvent(commit, "click", async () => {
      const activity = this.value();
      if (!activity || this.committing) return;

      this.committing = true;
      commit.disabled = true;
      commit.setText("Logging…");

      try {
        await this.options.onCommit(activity, this.noteEl?.value.trim() ?? "");
      } finally {
        this.committing = false;
      }
    });
  }

  private value(): string {
    return (this.customEl?.value.trim() || this.selected).trim();
  }

  private paint(): void {
    for (const [activity, chip] of this.chips) {
      const active = activity === this.selected;
      chip.toggleClass("is-selected", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    if (this.commitEl && !this.committing) {
      this.commitEl.disabled = this.value().length === 0;
    }
  }
}

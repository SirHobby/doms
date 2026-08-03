import { Component, type App } from "obsidian";
import { formatIsoDate, today, type CivilDate, type WeekDay } from "../../data/dates";
import type { SessionDraft } from "../../data/drafts";
import { draftDate, keyOf, newDraft } from "../../data/drafts";
import { SheetHeader } from "./sheet-header";

export interface ActivitySheetOptions {
  /** Heading, e.g. "Cardio" or "A different workout". */
  title: string;
  /** The template being logged, so a draft can be keyed to it. */
  templateId: string;
  /** Fast-path suggestions. Free text is always allowed. */
  activities: readonly string[];
  /** Text on the commit button. */
  commitText: string;
  /** For the date picker the header opens. */
  app: App;
  weekStart: WeekDay;
  /** Seeds the header when the flow already chose a day. */
  date?: CivilDate;
  /** An in-progress entry to pick back up, if there is one. */
  draft?: SessionDraft | null;
  onBack: () => void;
  onDraft?: (draft: SessionDraft, previousKey: string) => void;
  onCommit: (activity: string, note: string, date: CivilDate) => Promise<void>;
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
  private header: SheetHeader | null = null;
  private chips = new Map<string, HTMLButtonElement>();
  private committing = false;
  private draft: SessionDraft;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: ActivitySheetOptions,
  ) {
    super();

    const draft = options.draft;
    this.draft = draft
      ? { ...draft, sets: { ...draft.sets } }
      : newDraft(options.templateId, options.date ?? today());

    // A restored activity comes back as a chip if it was one, or as typed text
    // if it was not. The sheet cannot tell the difference after the fact, so it
    // matches against the offered list.
    if (options.activities.includes(this.draft.activity)) {
      this.selected = this.draft.activity;
    }
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
    this.header = new SheetHeader(root, {
      title: this.options.title,
      app: this.options.app,
      weekStart: this.options.weekStart,
      date: draftDate(this.draft),
      onBack: () => this.options.onBack(),
      onDateChange: (date) => {
        const previousKey = keyOf(this.draft);
        this.draft.dateIso = formatIsoDate(date);
        this.emitDraft(previousKey);
      },
    });
    this.addChild(this.header);
  }

  private emitDraft(previousKey: string): void {
    this.draft.activity = this.value();
    this.draft.note = this.noteEl?.value ?? "";
    this.draft.updatedAt = Date.now();
    this.options.onDraft?.({ ...this.draft }, previousKey);
  }

  private onChanged(): void {
    this.emitDraft(keyOf(this.draft));
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
        this.onChanged();
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

    // Free text, restored: only if it was not one of the offered chips.
    if (this.draft.activity && !this.selected) field.value = this.draft.activity;

    this.registerDomEvent(field, "input", () => {
      // Typing wins over a chip; they are two ways to fill one value.
      if (field.value.trim()) this.selected = "";
      this.paint();
      this.onChanged();
    });
  }

  private renderNote(root: HTMLElement): void {
    const field = root.createEl("textarea", {
      cls: "doms-sheet-textarea",
      attr: {
        rows: "3",
        placeholder: "Add a note about today",
        "aria-label": "Note about today",
      },
    });
    field.value = this.draft.note;
    this.noteEl = field;
    this.registerDomEvent(field, "input", () => this.onChanged());
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
        await this.options.onCommit(
          activity,
          this.noteEl?.value.trim() ?? "",
          this.header?.value ?? today(),
        );
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

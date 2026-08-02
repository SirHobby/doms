import { Component, type App } from "obsidian";
import { today, type CivilDate, type WeekDay } from "../../data/dates";
import { muscleLabel, type MuscleGroup } from "../../data/muscles";
import type { Template } from "../../data/templates";
import { sumSets } from "../../data/templates";
import { SheetHeader } from "./sheet-header";
import { Stepper } from "./stepper";

export interface SessionSheetOptions {
  template: Template;
  /** For the date picker the header opens. */
  app: App;
  weekStart: WeekDay;
  onBack: () => void;
  onCommit: (
    sets: Record<MuscleGroup, number>,
    note: string,
    date: CivilDate,
  ) => Promise<void>;
}

/**
 * The session sheet (spec §4.2).
 *
 * Nothing is written to disk until "Log as planned" is pressed. That is what
 * makes cancel and undo trivial, and it means one celebration per gym visit
 * rather than one per rack.
 */
export class SessionSheet extends Component {
  /** What the user has actually counted. Starts at zero for every group. */
  private readonly sets: Record<MuscleGroup, number>;
  /** What the template suggests, shown as a per-group goal. */
  private readonly goals: Record<MuscleGroup, number>;
  private totalEl: HTMLElement | null = null;
  private commitEl: HTMLButtonElement | null = null;
  private noteEl: HTMLTextAreaElement | null = null;
  private header: SheetHeader | null = null;
  private committing = false;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: SessionSheetOptions,
  ) {
    super();
    this.goals = { ...options.template.sets };
    // Count up during the session rather than editing a pre-filled plan down.
    this.sets = Object.fromEntries(
      Object.keys(this.goals).map((muscle) => [muscle, 0]),
    );
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-sheet" });
    this.register(() => root.detach());

    this.renderHeader(root);

    const list = root.createDiv({ cls: "doms-sheet-list" });
    for (const muscle of Object.keys(this.goals)) {
      this.addChild(
        new Stepper(list, {
          label: muscleLabel(muscle),
          value: 0,
          goal: this.goals[muscle],
          onChange: (value) => {
            this.sets[muscle] = value;
            this.paintTotal();
          },
        }),
      );
    }

    this.totalEl = root.createDiv({ cls: "doms-sheet-total" });
    this.paintTotal();

    this.renderNote(root);
    this.renderActions(root);
  }

  private renderHeader(root: HTMLElement): void {
    this.header = new SheetHeader(root, {
      title: this.options.template.name,
      app: this.options.app,
      weekStart: this.options.weekStart,
      onBack: () => this.options.onBack(),
    });
    this.addChild(this.header);
  }

  private renderNote(root: HTMLElement): void {
    const wrapper = root.createDiv({ cls: "doms-sheet-note" });

    const toggle = wrapper.createEl("button", {
      cls: "doms-button doms-button-secondary",
      text: "Add a note about today",
    });
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");

    this.registerDomEvent(toggle, "click", () => {
      if (this.noteEl) {
        this.noteEl.focus();
        return;
      }
      const field = wrapper.createEl("textarea", {
        cls: "doms-sheet-textarea",
        attr: {
          rows: "3",
          placeholder: "Felt strong. Knee twinge on the last set.",
          "aria-label": "Note about today",
        },
      });
      this.noteEl = field;
      toggle.setAttribute("aria-expanded", "true");
      toggle.detach();
      field.focus();
    });
  }

  private renderActions(root: HTMLElement): void {
    const actions = root.createDiv({ cls: "doms-sheet-actions" });

    const commit = actions.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: "Log as planned",
    });
    commit.type = "button";
    this.commitEl = commit;

    this.registerDomEvent(commit, "click", async () => {
      // A double tap on a slow vault would otherwise write two notes.
      if (this.committing) return;
      this.committing = true;
      commit.disabled = true;
      commit.setText("Logging…");

      try {
        await this.options.onCommit(
          // Nothing counted means "I did the plan" — the one-tap fast path.
          sumSets(this.sets) === 0 ? { ...this.goals } : { ...this.sets },
          this.noteEl?.value.trim() ?? "",
          this.header?.value ?? today(),
        );
      } finally {
        this.committing = false;
      }
    });
  }

  private paintTotal(): void {
    const total = sumSets(this.sets);
    const goal = sumSets(this.goals);

    this.totalEl?.setText(`${total} of ${goal} sets`);
    this.totalEl?.toggleClass("is-met", total >= goal && goal > 0);

    // Untouched, the button logs the plan. Once you have counted anything, it
    // logs what you counted.
    if (this.commitEl && !this.committing) {
      this.commitEl.setText(
        total === 0 ? "Log as planned" : `Log ${total} ${total === 1 ? "set" : "sets"}`,
      );
    }
  }
}

import { Component, type App } from "obsidian";
import {
  daySetTotal,
  DEFAULT_DAY_SETS,
  MAX_DAY_NAME,
  type CustomDay,
} from "../../data/custom-days";
import { describeSets, muscleLabel, type MuscleGroup } from "../../data/muscles";
import { MusclePickerModal } from "../../ui/muscle-picker-modal";
import { ConfirmModal } from "../../ui/confirm-modal";
import { Stepper } from "./stepper";

export interface CreateDaySheetOptions {
  app: App;
  /** The days already created, listed so they can be removed here too. */
  existing: readonly CustomDay[];
  onBack: () => void;
  onCreate: (name: string, sets: Record<MuscleGroup, number>) => Promise<void>;
  onRemove: (day: CustomDay) => Promise<void>;
}

/**
 * "Create a day" — building a reusable workout on the custom routine.
 *
 * The custom routine prescribes nothing, which is the point of it, but it meant
 * anyone training the same three workouts on a rotation had to rebuild each one
 * from an empty sheet every time. This saves the choice once.
 *
 * Managing the days lives here rather than in settings: they are created from
 * the Week tab, so that is where someone will look to delete one.
 */
export class CreateDaySheet extends Component {
  private readonly sets: Record<MuscleGroup, number> = {};
  private readonly rows = new Map<MuscleGroup, Stepper>();

  private nameEl: HTMLInputElement | null = null;
  private listEl: HTMLElement | null = null;
  private addEl: HTMLElement | null = null;
  private saveEl: HTMLButtonElement | null = null;
  private saving = false;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: CreateDaySheetOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-sheet" });
    this.register(() => root.detach());

    this.renderHeader(root);
    this.renderExisting(root);
    this.renderName(root);

    const list = root.createDiv({ cls: "doms-sheet-list" });
    this.listEl = list;
    this.renderAddCard(list);

    this.renderActions(root);
    this.paint();
  }

  /** No date on this sheet: creating a day is not logging one. */
  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "doms-sheet-header" });

    const back = header.createEl("button", {
      cls: "doms-sheet-back",
      text: "← Back",
    });
    back.type = "button";
    back.setAttribute("aria-label", "Back to the week");
    this.registerDomEvent(back, "click", () => this.options.onBack());

    header.createEl("h3", { cls: "doms-sheet-title", text: "Create a day" });
  }

  private renderExisting(root: HTMLElement): void {
    if (this.options.existing.length === 0) return;

    const section = root.createDiv({ cls: "doms-days" });
    section.createDiv({ cls: "doms-days-heading", text: "Your days" });

    for (const day of this.options.existing) {
      const row = section.createDiv({ cls: "doms-slot doms-slot-done" });
      row.createSpan({ cls: "doms-slot-name", text: day.name });
      row.createSpan({
        cls: "doms-slot-meta",
        text: `${daySetTotal(day)} sets · ${describeSets(day.sets, "no body parts")}`,
      });

      const remove = row.createEl("button", {
        cls: "doms-stepper-remove",
        text: "×",
      });
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${day.name}`);
      this.registerDomEvent(remove, "click", () => this.confirmRemove(day));
    }
  }

  /**
   * Removing a day leaves every session logged under it exactly as it was. It
   * is worth saying so: the natural fear is that deleting the template deletes
   * the history.
   */
  private confirmRemove(day: CustomDay): void {
    new ConfirmModal(this.options.app, {
      title: `Remove ${day.name}?`,
      body: [
        "It stops being offered on the Week tab.",
        "Workouts you have already logged under it are not touched.",
      ],
      confirmText: "Remove",
      onConfirm: () => this.options.onRemove(day),
    }).open();
  }

  private renderName(root: HTMLElement): void {
    const field = root.createEl("input", {
      cls: "doms-input",
      attr: {
        type: "text",
        placeholder: "Name it, e.g. Arms and abs",
        "aria-label": "Name for this day",
        maxlength: String(MAX_DAY_NAME),
      },
    });
    this.nameEl = field;
    this.registerDomEvent(field, "input", () => this.paint());
  }

  private renderAddCard(list: HTMLElement): void {
    const add = list.createEl("button", { cls: "doms-stepper-add" });
    add.type = "button";
    add.setText("+");
    add.setAttribute("aria-label", "Add a body part to this day");
    this.addEl = add;

    this.registerDomEvent(add, "click", () => {
      new MusclePickerModal(this.options.app, {
        exclude: new Set(Object.keys(this.sets)),
        onPick: (muscle) => this.addMuscle(muscle.id),
      }).open();
    });
  }

  private addMuscle(muscle: MuscleGroup): void {
    if (muscle in this.sets || !this.listEl) return;

    // A body part you just chose to include should start at a usable number,
    // not at zero — zero would drop it again the moment the day is saved.
    this.sets[muscle] = DEFAULT_DAY_SETS;

    const stepper = new Stepper(this.listEl, {
      label: muscleLabel(muscle),
      value: DEFAULT_DAY_SETS,
      onRemove: () => this.removeMuscle(muscle),
      onChange: (value) => {
        this.sets[muscle] = value;
        this.paint();
      },
    });
    this.addChild(stepper);
    this.rows.set(muscle, stepper);

    if (this.addEl) this.listEl.appendChild(this.addEl);
    this.paint();
  }

  private removeMuscle(muscle: MuscleGroup): void {
    const stepper = this.rows.get(muscle);
    if (!stepper) return;

    this.removeChild(stepper);
    this.rows.delete(muscle);
    delete this.sets[muscle];
    this.paint();
  }

  private renderActions(root: HTMLElement): void {
    const actions = root.createDiv({ cls: "doms-sheet-actions" });

    const save = actions.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: "Save this day",
    });
    save.type = "button";
    this.saveEl = save;

    this.registerDomEvent(save, "click", async () => {
      if (this.saving || !this.ready()) return;
      this.saving = true;
      save.disabled = true;
      save.setText("Saving…");

      try {
        await this.options.onCreate(
          this.nameEl?.value.trim() ?? "",
          { ...this.sets },
        );
      } finally {
        this.saving = false;
      }
    });
  }

  private ready(): boolean {
    const named = (this.nameEl?.value.trim().length ?? 0) > 0;
    return named && Object.keys(this.sets).length > 0;
  }

  private paint(): void {
    if (this.saveEl && !this.saving) {
      this.saveEl.disabled = !this.ready();
      const total = daySetTotal({ id: "", name: "", sets: this.sets });
      this.saveEl.setText(
        total > 0 ? `Save this day · ${total} sets` : "Save this day",
      );
    }
  }
}

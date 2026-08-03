import { Component, type App } from "obsidian";
import { formatIsoDate, today, type CivilDate, type WeekDay } from "../../data/dates";
import { muscleLabel, type MuscleGroup } from "../../data/muscles";
import type { SessionDraft } from "../../data/drafts";
import { draftDate, keyOf, newDraft } from "../../data/drafts";
import { CUSTOM_TEMPLATE_ID, type Template } from "../../data/templates";
import { sumSets } from "../../data/templates";
import { MusclePickerModal } from "../../ui/muscle-picker-modal";
import { SheetHeader } from "./sheet-header";
import { Stepper } from "./stepper";

export interface SessionSheetOptions {
  template: Template;
  /** For the date picker the header opens. */
  app: App;
  weekStart: WeekDay;
  /** Seeds the header when the flow already chose a day. */
  date?: CivilDate;
  /** An in-progress session to pick back up, if there is one. */
  draft?: SessionDraft | null;
  onBack: () => void;
  /**
   * Fires on every edit. The sheet holds nothing on disk, so this is what makes
   * a half-counted workout survive leaving the view.
   */
  onDraft?: (draft: SessionDraft, previousKey: string) => void;
  onCommit: (
    sets: Record<MuscleGroup, number>,
    note: string,
    date: CivilDate,
  ) => Promise<void>;
}

/**
 * The session sheet (spec §4.2).
 *
 * Nothing is written to the *log* until "Log as planned" is pressed. That is
 * what makes cancel and undo trivial, and it means one celebration per gym visit
 * rather than one per rack.
 *
 * Counting, though, is saved continuously. The two are not in tension: a draft
 * is plugin state that produces no note, no week credit and no stats, so undo
 * stays a single file deletion — while walking away mid-session, which is the
 * normal way this screen gets used, no longer costs you the workout.
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

  /** Where added rows mount: before the "+" card, after the planned ones. */
  private listEl: HTMLElement | null = null;
  private addEl: HTMLElement | null = null;
  private emptyEl: HTMLElement | null = null;
  /** Body parts the user added to this session, and their stepper. */
  private readonly extras = new Map<MuscleGroup, Stepper>();

  /** The draft being written to. Its key moves if the date changes. */
  private draft: SessionDraft;

  /**
   * A workout the plan never prescribed: no goals, no "log as planned" fast
   * path, and the body part list starts empty.
   */
  private readonly isCustom: boolean;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: SessionSheetOptions,
  ) {
    super();
    this.isCustom = options.template.id === CUSTOM_TEMPLATE_ID;
    this.goals = { ...options.template.sets };

    const draft = options.draft;
    this.draft = draft
      ? { ...draft, sets: { ...draft.sets } }
      : newDraft(options.template.id, options.date ?? today());

    // Count up during the session rather than editing a pre-filled plan down.
    // A restored draft brings back both the planned rows and any body parts the
    // user added before they walked away.
    this.sets = Object.fromEntries(
      Object.keys(this.goals).map((muscle) => [muscle, 0]),
    );
    for (const [muscle, count] of Object.entries(this.draft.sets)) {
      this.sets[muscle] = count;
    }
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-sheet" });
    this.register(() => root.detach());

    this.renderHeader(root);

    const list = root.createDiv({ cls: "doms-sheet-list" });
    this.listEl = list;

    // Restored extras have to render as extras — removable, no goal — even
    // though they are indistinguishable from planned rows in `sets`.
    const planned = new Set(Object.keys(this.goals));

    for (const muscle of planned) {
      this.addChild(
        new Stepper(list, {
          label: muscleLabel(muscle),
          value: this.sets[muscle] ?? 0,
          goal: this.goals[muscle],
          onChange: (value) => {
            this.sets[muscle] = value;
            this.onChanged();
          },
        }),
      );
    }

    this.renderEmpty(list);
    this.renderAddCard(list);

    for (const muscle of Object.keys(this.sets)) {
      if (!planned.has(muscle)) this.mountExtra(muscle);
    }

    this.totalEl = root.createDiv({ cls: "doms-sheet-total" });

    this.renderNote(root);
    this.renderActions(root);
    this.paintTotal();
  }

  /**
   * The custom sheet opens with nothing on it, which without a word of
   * explanation reads as a broken screen rather than an invitation.
   */
  private renderEmpty(list: HTMLElement): void {
    if (!this.isCustom) return;

    this.emptyEl = list.createDiv({
      cls: "doms-sheet-empty",
      text: "Add the body parts you trained.",
    });
  }

  /**
   * The "+" at the end of the list.
   *
   * Training something the session does not list is normal — abs after push
   * day, a warmup, grip work — and without this there was nowhere to put it,
   * so it either went unlogged or got mashed into an unrelated group.
   */
  private renderAddCard(list: HTMLElement): void {
    const add = list.createEl("button", { cls: "doms-stepper-add" });
    add.type = "button";
    add.setText("+");
    add.setAttribute("aria-label", "Add another body part");
    this.addEl = add;

    this.registerDomEvent(add, "click", () => {
      new MusclePickerModal(this.options.app, {
        // Everything already on the sheet, planned or added.
        exclude: new Set(Object.keys(this.sets)),
        onPick: (muscle) => this.addMuscle(muscle.id),
      }).open();
    });
  }

  private addMuscle(muscle: MuscleGroup): void {
    if (muscle in this.sets || !this.listEl) return;

    this.sets[muscle] = 0;
    this.mountExtra(muscle);
    this.onChanged();
  }

  /** Renders one user-added row and keeps the "+" last in the list. */
  private mountExtra(muscle: MuscleGroup): void {
    if (!this.listEl) return;

    // No goal: the plan never asked for this, so there is nothing to be short
    // of. It still counts toward the weekly bar if the group is a tracked one.
    const stepper = new Stepper(this.listEl, {
      label: muscleLabel(muscle),
      value: this.sets[muscle] ?? 0,
      onRemove: () => this.removeMuscle(muscle),
      onChange: (value) => {
        this.sets[muscle] = value;
        this.onChanged();
      },
    });
    this.addChild(stepper);
    this.extras.set(muscle, stepper);

    // Keep the "+" last, so the list always ends with the way to extend it.
    if (this.addEl) this.listEl.appendChild(this.addEl);
    this.paintEmpty();
  }

  private removeMuscle(muscle: MuscleGroup): void {
    const stepper = this.extras.get(muscle);
    if (!stepper) return;

    this.removeChild(stepper);
    this.extras.delete(muscle);
    delete this.sets[muscle];
    this.paintEmpty();
    this.onChanged();
  }

  private paintEmpty(): void {
    this.emptyEl?.toggleClass("is-hidden", Object.keys(this.sets).length > 0);
  }

  private renderHeader(root: HTMLElement): void {
    this.header = new SheetHeader(root, {
      title: this.options.template.name,
      app: this.options.app,
      weekStart: this.options.weekStart,
      date: draftDate(this.draft),
      onBack: () => this.options.onBack(),
      onDateChange: (date) => this.onDateChanged(date),
    });
    this.addChild(this.header);
  }

  /** The draft follows the day it is for, rather than staying under the old key. */
  private onDateChanged(date: CivilDate): void {
    const previousKey = keyOf(this.draft);
    this.draft.dateIso = formatIsoDate(date);
    this.emitDraft(previousKey);
  }

  private renderNote(root: HTMLElement): void {
    const wrapper = root.createDiv({ cls: "doms-sheet-note" });

    const toggle = wrapper.createEl("button", {
      cls: "doms-button doms-button-secondary",
      text: "Add a note about today",
    });
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");

    const open = () => {
      const field = wrapper.createEl("textarea", {
        cls: "doms-sheet-textarea",
        attr: {
          rows: "3",
          placeholder: "Felt strong. Knee twinge on the last set.",
          "aria-label": "Note about today",
        },
      });
      field.value = this.draft.note;
      this.noteEl = field;
      toggle.setAttribute("aria-expanded", "true");
      toggle.detach();
      this.registerDomEvent(field, "input", () => this.onChanged());
      return field;
    };

    // A restored note is the whole reason to reopen the field unprompted:
    // hiding typed text behind a button reads as having lost it.
    if (this.draft.note) open();

    this.registerDomEvent(toggle, "click", () => {
      if (this.noteEl) {
        this.noteEl.focus();
        return;
      }
      open().focus();
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
          this.payload(),
          this.noteEl?.value.trim() ?? "",
          this.header?.value ?? today(),
        );
      } finally {
        this.committing = false;
      }
    });
  }

  /**
   * What gets logged. Nothing counted means "I did the plan" — the one-tap fast
   * path — except on a custom workout, which has no plan to fall back on.
   */
  private payload(): Record<MuscleGroup, number> {
    if (this.isCustom || sumSets(this.sets) > 0) return { ...this.sets };
    return { ...this.goals };
  }

  /** Records the edit, then repaints the total and the button. */
  private onChanged(): void {
    this.draft.sets = { ...this.sets };
    this.draft.note = this.noteEl?.value ?? "";
    this.draft.updatedAt = Date.now();
    this.emitDraft(keyOf(this.draft));
    this.paintTotal();
  }

  private emitDraft(previousKey: string): void {
    this.options.onDraft?.({ ...this.draft, sets: { ...this.sets } }, previousKey);
  }

  private paintTotal(): void {
    const total = sumSets(this.sets);
    const goal = sumSets(this.goals);

    this.totalEl?.setText(
      goal > 0
        ? `${total} of ${goal} sets`
        : `${total} ${total === 1 ? "set" : "sets"}`,
    );
    this.totalEl?.toggleClass("is-met", total >= goal && goal > 0);

    // Untouched, the button logs the plan. Once you have counted anything, it
    // logs what you counted. A custom workout can only ever log what you counted,
    // so it stays disabled until there is something to log.
    if (this.commitEl && !this.committing) {
      this.commitEl.disabled = this.isCustom && total === 0;
      this.commitEl.setText(
        total === 0 && !this.isCustom
          ? "Log as planned"
          : `Log ${total} ${total === 1 ? "set" : "sets"}`,
      );
    }
  }
}

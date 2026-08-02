import { Component, type App } from "obsidian";
import {
  formatLongDate,
  formatShortDate,
  isSameDate,
  today,
  type CivilDate,
  type WeekDay,
} from "../../data/dates";
import { DatePickerModal } from "../../ui/date-picker-modal";

export interface SheetHeaderOptions {
  title: string;
  app: App;
  weekStart: WeekDay;
  /** The day the sheet opens on. Today, unless the flow already picked one. */
  date?: CivilDate;
  onBack: () => void;
}

/**
 * Back, title, date — the row every logging sheet opens with (spec §4.2).
 *
 * The date lives here rather than next to the commit button because it is
 * context for the whole sheet, not a step in it: you decide *when* this workout
 * happened before you start counting sets, and forgetting to log yesterday is
 * common enough that the answer has to be visible without a tap.
 */
export class SheetHeader extends Component {
  private date: CivilDate;
  private dateEl: HTMLButtonElement | null = null;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: SheetHeaderOptions,
  ) {
    super();
    this.date = options.date ?? today();
  }

  /** The day the sheet will log for. Today unless the user has said otherwise. */
  get value(): CivilDate {
    return this.date;
  }

  onload(): void {
    const header = this.parent.createDiv({ cls: "doms-sheet-header" });
    this.register(() => header.detach());

    const back = header.createEl("button", {
      cls: "doms-sheet-back",
      text: "← Back",
    });
    back.type = "button";
    back.setAttribute("aria-label", "Back to the week");
    this.registerDomEvent(back, "click", () => this.options.onBack());

    header.createEl("h3", { cls: "doms-sheet-title", text: this.options.title });

    const date = header.createEl("button", { cls: "doms-sheet-date" });
    date.type = "button";
    this.dateEl = date;
    this.registerDomEvent(date, "click", () => this.openPicker());

    this.paint();
  }

  private openPicker(): void {
    new DatePickerModal(this.options.app, {
      selected: this.date,
      weekStart: this.options.weekStart,
      onPick: (picked) => {
        this.date = picked;
        this.paint();
      },
    }).open();
  }

  private paint(): void {
    const date = this.dateEl;
    if (!date) return;

    const isToday = isSameDate(this.date, today());
    date.setText(isToday ? "Today" : formatShortDate(this.date));
    // Backdating is a deliberate choice, so it should look like one.
    date.toggleClass("is-backdated", !isToday);
    date.setAttribute(
      "aria-label",
      `Logging for ${formatLongDate(this.date)}. Change the date.`,
    );
  }
}

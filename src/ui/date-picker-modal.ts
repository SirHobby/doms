import { Modal, type App } from "obsidian";
import {
  addDays,
  compareDates,
  dayIndexInWeek,
  daysInMonth,
  earliestLoggableDate,
  formatLongDate,
  isSameDate,
  monthLabel,
  shiftMonth,
  today,
  weekdayLabels,
  type CivilDate,
  type WeekDay,
} from "../data/dates";

export interface DatePickerOptions {
  /** Where the calendar opens, and which cell reads as chosen. */
  selected: CivilDate;
  weekStart: WeekDay;
  /** Latest pickable day. Defaults to today — you cannot log the future. */
  max?: CivilDate;
  /** Earliest pickable day. Defaults to the backdate limit. */
  min?: CivilDate;
  onPick: (date: CivilDate) => void;
}


/**
 * "Which day was this?" — a month grid, plus one-tap shortcuts for the two days
 * that account for nearly every correction.
 *
 * Deliberately not `<input type="date">`: on Android that opens the system
 * dialog, which ignores the vault's week start and looks nothing like the rest
 * of the plugin. This reuses the calendar geometry from the Stats tab.
 */
export class DatePickerModal extends Modal {
  private year: number;
  private month: number;
  private selected: CivilDate;
  private readonly max: CivilDate;
  private readonly min: CivilDate;

  private gridEl: HTMLElement | null = null;
  private labelEl: HTMLElement | null = null;
  private nextEl: HTMLButtonElement | null = null;
  private prevEl: HTMLButtonElement | null = null;

  constructor(
    app: App,
    private readonly options: DatePickerOptions,
  ) {
    super(app);
    this.selected = options.selected;
    this.max = options.max ?? today();
    this.min = options.min ?? earliestLoggableDate(this.max);
    this.year = this.selected.year;
    this.month = this.selected.month;
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    // Modals render outside the view, so they need the variable host to pick up
    // the plugin's accent.
    modalEl.addClass("doms-view");
    modalEl.addClass("doms-datepicker");

    this.titleEl.setText("Log for");

    this.renderShortcuts(contentEl);

    const calendar = contentEl.createDiv({ cls: "doms-calendar" });
    this.renderHeader(calendar);

    const weekdays = calendar.createDiv({ cls: "doms-calendar-weekdays" });
    weekdays.setAttribute("aria-hidden", "true");
    for (const day of weekdayLabels(this.options.weekStart)) {
      weekdays.createDiv({ cls: "doms-calendar-weekday", text: day });
    }

    this.gridEl = calendar.createDiv({ cls: "doms-calendar-grid" });
    this.paint();
  }

  /** Yesterday is the whole reason this dialog exists; today undoes a misfire. */
  private renderShortcuts(parent: HTMLElement): void {
    const row = parent.createDiv({ cls: "doms-chips doms-datepicker-shortcuts" });

    for (const [label, offset] of [
      ["Today", 0],
      ["Yesterday", -1],
    ] as const) {
      const date = addDays(this.max, offset);
      const chip = row.createEl("button", { cls: "doms-chip", text: label });
      chip.type = "button";
      chip.addEventListener("click", () => this.pick(date));
    }
  }

  private renderHeader(parent: HTMLElement): void {
    const header = parent.createDiv({ cls: "doms-calendar-header" });

    this.prevEl = this.arrow(header, "‹", "Previous month", -1);
    this.labelEl = header.createDiv({ cls: "doms-calendar-label" });
    this.labelEl.setAttribute("role", "status");
    this.nextEl = this.arrow(header, "›", "Next month", 1);
  }

  private arrow(
    parent: HTMLElement,
    glyph: string,
    label: string,
    delta: number,
  ): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: "doms-calendar-arrow",
      text: glyph,
    });
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.addEventListener("click", () => {
      const next = shiftMonth(this.year, this.month, delta);
      if (this.isOutOfRange(next.year, next.month)) return;
      this.year = next.year;
      this.month = next.month;
      this.paint();
    });
    return button;
  }

  private isFutureMonth(year: number, month: number): boolean {
    return year > this.max.year || (year === this.max.year && month > this.max.month);
  }

  /** Before the backdate limit, so there is nothing pickable in it. */
  private isPastMonth(year: number, month: number): boolean {
    return year < this.min.year || (year === this.min.year && month < this.min.month);
  }

  private isOutOfRange(year: number, month: number): boolean {
    return this.isFutureMonth(year, month) || this.isPastMonth(year, month);
  }

  private paint(): void {
    const grid = this.gridEl;
    if (!grid) return;
    grid.empty();

    this.labelEl?.setText(monthLabel(this.year, this.month));

    if (this.nextEl) {
      const next = shiftMonth(this.year, this.month, 1);
      this.nextEl.disabled = this.isOutOfRange(next.year, next.month);
    }
    if (this.prevEl) {
      const prev = shiftMonth(this.year, this.month, -1);
      this.prevEl.disabled = this.isOutOfRange(prev.year, prev.month);
    }

    const lead = dayIndexInWeek(
      { year: this.year, month: this.month, day: 1 },
      this.options.weekStart,
    );
    for (let i = 0; i < lead; i++) {
      grid.createDiv({ cls: "doms-calendar-cell is-blank" });
    }

    const total = daysInMonth(this.year, this.month);
    for (let day = 1; day <= total; day++) {
      const date: CivilDate = { year: this.year, month: this.month, day };

      const cell = grid.createEl("button", {
        cls: "doms-calendar-cell doms-datepicker-day",
        text: String(day),
      });
      cell.type = "button";
      cell.setAttribute("aria-label", formatLongDate(date));

      // A session you have not done yet is not a correction, it is a typo — and
      // past the backdate limit nobody remembers what they actually did.
      if (compareDates(date, this.max) > 0 || compareDates(date, this.min) < 0) {
        cell.disabled = true;
        continue;
      }

      if (isSameDate(date, this.max)) cell.addClass("is-today");
      if (isSameDate(date, this.selected)) {
        cell.addClass("is-selected");
        cell.setAttribute("aria-current", "date");
      }

      cell.addEventListener("click", () => this.pick(date));
    }
  }

  private pick(date: CivilDate): void {
    if (compareDates(date, this.max) > 0 || compareDates(date, this.min) < 0) return;
    this.selected = date;
    this.options.onPick(date);
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
    this.modalEl.removeClass("doms-view");
    this.modalEl.removeClass("doms-datepicker");
  }
}

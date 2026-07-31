import { Component } from "obsidian";
import { formatIsoDate, shiftMonth, today } from "../../data/dates";
import { buildMonth, type StatsOptions } from "../../data/stats";
import type { SessionRecord } from "../../data/types";

export interface MonthCalendarOptions {
  sessions: readonly SessionRecord[];
  stats: StatsOptions;
}

/**
 * A month of activity at a time, with arrows either side of the label.
 *
 * A rolling year grid put ~365 squares on screen at once, which read as noise
 * and made every cell too small to mean anything. Cells here are a fixed size
 * and vary only in fill — intensity is colour, never geometry — and they are
 * not interactive, so the calendar is a readout rather than a control surface.
 */
export class MonthCalendar extends Component {
  private year: number;
  private month: number;
  private body: HTMLElement | null = null;
  private label: HTMLElement | null = null;
  private nextButton: HTMLButtonElement | null = null;

  private readonly current = today();

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: MonthCalendarOptions,
  ) {
    super();
    this.year = this.current.year;
    this.month = this.current.month;
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-calendar" });
    this.register(() => root.detach());

    this.renderHeader(root);
    this.body = root.createDiv({ cls: "doms-calendar-body" });
    this.paint();
  }

  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "doms-calendar-header" });

    // Back is always allowed; forward stops at the current month.
    this.arrow(header, "‹", "Previous month", -1);
    this.label = header.createDiv({ cls: "doms-calendar-label" });
    this.label.setAttribute("role", "status");
    this.nextButton = this.arrow(header, "›", "Next month", 1);
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
    this.registerDomEvent(button, "click", () => this.step(delta));
    return button;
  }

  private step(delta: number): void {
    const next = shiftMonth(this.year, this.month, delta);
    if (this.isFuture(next.year, next.month)) return;
    this.year = next.year;
    this.month = next.month;
    this.paint();
  }

  private isFuture(year: number, month: number): boolean {
    return (
      year > this.current.year ||
      (year === this.current.year && month > this.current.month)
    );
  }

  private paint(): void {
    const body = this.body;
    if (!body) return;
    body.empty();

    const grid = buildMonth(
      this.options.sessions,
      this.year,
      this.month,
      this.options.stats,
    );

    this.label?.setText(grid.label);

    if (this.nextButton) {
      const next = shiftMonth(this.year, this.month, 1);
      this.nextButton.disabled = this.isFuture(next.year, next.month);
    }

    const weekdays = body.createDiv({ cls: "doms-calendar-weekdays" });
    weekdays.setAttribute("aria-hidden", "true");
    for (const day of grid.weekdays) {
      weekdays.createDiv({ cls: "doms-calendar-weekday", text: day });
    }

    const days = body.createDiv({ cls: "doms-calendar-grid" });
    for (const cell of grid.cells) {
      if (!cell) {
        days.createDiv({ cls: "doms-calendar-cell is-blank" });
        continue;
      }

      const el = days.createDiv({ cls: "doms-calendar-cell" });
      el.dataset.level = String(cell.level);
      el.setText(String(cell.date.day));
      el.setAttribute("title", this.describe(cell.dateIso, cell.sets, cell.sessions));

      if (cell.dateIso === formatIsoDate(this.current)) el.addClass("is-today");
    }

    const footer = body.createDiv({ cls: "doms-calendar-footer" });
    footer.setText(
      grid.sessionCount === 0
        ? "No sessions this month"
        : `${grid.sessionCount} ${grid.sessionCount === 1 ? "session" : "sessions"} · ${grid.totalSets} sets`,
    );
  }

  private describe(
    dateIso: string,
    sets: number,
    sessions: readonly SessionRecord[],
  ): string {
    if (sessions.length === 0) return `${dateIso}: nothing logged`;
    const names = sessions
      .map((session) => session.activity ?? session.templateId)
      .join(", ");
    return `${dateIso}: ${names}${sets > 0 ? ` · ${sets} sets` : ""}`;
  }
}

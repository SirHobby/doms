import { formatIsoDate, today } from "../data/dates";
import { buildMonth, type StatsOptions } from "../data/stats";
import type { SessionRecord } from "../data/types";
import { bool, pick, type WidgetSource } from "./options";

export interface ActivityOptions {
  view: "calendar" | "dots";
  /** Hides the "8 days this month" line. */
  summary: boolean;
}

export function activityOptions(source: WidgetSource): ActivityOptions {
  return {
    view: pick(source, "view", ["calendar", "dots"] as const, "calendar"),
    summary: bool(source, "summary", true),
  };
}

export interface ActivityInput {
  sessions: readonly SessionRecord[];
  stats: StatsOptions;
  options: ActivityOptions;
}

/**
 * Days trained this month, as a calendar or a dot grid.
 *
 * Pure render: it takes sessions and paints. Refreshing when the vault changes
 * is the caller's job, which is what lets the same function serve both a code
 * block and the tabbed view.
 */
export function renderActivityWidget(
  containerEl: HTMLElement,
  input: ActivityInput,
): void {
  containerEl.empty();

  const now = today();
  const grid = buildMonth(input.sessions, now.year, now.month, input.stats);
  const todayIso = formatIsoDate(now);

  const root = containerEl.createDiv({ cls: "doms-widget-activity" });

  const header = root.createDiv({ cls: "doms-widget-header" });
  header.createSpan({ cls: "doms-widget-title", text: grid.label });

  const trained = grid.cells.filter(
    (cell) => cell !== null && cell.sessions.length > 0,
  ).length;

  if (input.options.summary) {
    header.createSpan({
      cls: "doms-widget-count",
      // "days this month", not sessions: two sessions in a day is still one day
      // at the gym, and days is what the habit is measured in.
      text: `${trained} ${trained === 1 ? "day" : "days"} this month`,
    });
  }

  if (input.options.view === "dots") {
    renderDots(root, grid.cells, todayIso);
  } else {
    renderCalendar(root, grid, todayIso);
  }
}

function renderCalendar(
  root: HTMLElement,
  grid: ReturnType<typeof buildMonth>,
  todayIso: string,
): void {
  const weekdays = root.createDiv({ cls: "doms-widget-weekdays" });
  weekdays.setAttribute("aria-hidden", "true");
  for (const day of grid.weekdays) {
    weekdays.createDiv({ cls: "doms-widget-weekday", text: day });
  }

  const days = root.createDiv({ cls: "doms-widget-grid" });
  for (const cell of grid.cells) {
    if (!cell) {
      days.createDiv({ cls: "doms-widget-cell is-blank" });
      continue;
    }

    const el = days.createDiv({ cls: "doms-widget-cell" });
    el.dataset.level = String(cell.level);
    el.setText(String(cell.date.day));
    el.setAttribute("aria-label", describe(cell.dateIso, cell.sets, cell.sessions.length));
    if (cell.dateIso === todayIso) el.addClass("is-today");
  }
}

function renderDots(
  root: HTMLElement,
  cells: ReturnType<typeof buildMonth>["cells"],
  todayIso: string,
): void {
  const dots = root.createDiv({ cls: "doms-widget-dots" });
  for (const cell of cells) {
    if (!cell) continue;
    const dot = dots.createDiv({ cls: "doms-widget-dot" });
    dot.dataset.level = String(cell.level);
    dot.setAttribute("aria-label", describe(cell.dateIso, cell.sets, cell.sessions.length));
    if (cell.dateIso === todayIso) dot.addClass("is-today");
  }
}

function describe(dateIso: string, sets: number, sessions: number): string {
  if (sessions === 0) return `${dateIso}: rest`;
  const count = sessions > 1 ? `${sessions} sessions` : "1 session";
  return sets > 0 ? `${dateIso}: ${count}, ${sets} sets` : `${dateIso}: ${count}`;
}

import { TAB_LABELS, TabId } from "../../constants";
import {
  cumulativeVolume,
  summarize,
  weeklySets,
  type StatsOptions,
} from "../../data/stats";
import type { SessionRecord } from "../../data/types";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { BarList } from "../stats/bar-list";
import { MonthCalendar } from "../stats/month-calendar";
import { MetricCards } from "../stats/metric-cards";
import { DomsTab, type TabContext } from "./doms-tab";

export class StatsTab extends DomsTab {
  readonly id: TabId = "stats";
  readonly heading = TAB_LABELS.stats;
  readonly asciiKey: AsciiKey = "STATS";

  protected renderBody(root: HTMLElement, context: TabContext): void {
    const body = root.createDiv({ cls: "doms-stats" });
    const { data } = context.plugin;

    const sessions = data.sessions();
    const options: StatsOptions = {
      weekStart: context.plugin.settings.weekStart,
      templates: data.templates,
      plan: data.plan,
    };

    this.addChild(new MetricCards(body, summarize(sessions, options)));

    if (sessions.length === 0) {
      body.createDiv({
        cls: "doms-empty",
        text: "No sessions logged yet. The Week tab is where this starts.",
      });
      return;
    }

    this.renderActivity(body, sessions, options);
    this.renderWeeklySets(body, sessions, options);
    this.renderVolume(body, sessions);
  }

  private renderActivity(
    body: HTMLElement,
    sessions: readonly SessionRecord[],
    options: StatsOptions,
  ): void {
    this.section(body, "Activity");
    this.addChild(new MonthCalendar(body, { sessions, stats: options }));
  }

  private renderWeeklySets(
    body: HTMLElement,
    sessions: readonly SessionRecord[],
    options: StatsOptions,
  ): void {
    this.section(
      body,
      "This week's sets",
      "Sets logged against what your routine asks for. Diagnostic, not a goal.",
    );

    const week = weeklySets(sessions, options);

    this.addChild(
      new BarList(body, {
        emptyText: "Nothing logged this week yet.",
        rows: week.tracked.map((row) => ({
          label: row.label,
          fraction: row.target > 0 ? row.done / row.target : 0,
          value: `${row.done} / ${row.target}`,
        })),
      }),
    );

    // Untracked work is real work and belongs on the page — just not with a
    // denominator implying a goal was missed. Only rendered when there is some,
    // so the page does not carry twenty empty rows saying nothing.
    if (week.extra.length === 0) return;

    body.createDiv({
      cls: "doms-extra-note",
      text: "Also logged this week, with no weekly target:",
    });

    const list = body.createDiv({ cls: "doms-extra-list" });
    for (const row of week.extra) {
      const item = list.createDiv({ cls: "doms-extra-row" });
      item.createSpan({ cls: "doms-extra-label", text: row.label });
      item.createSpan({
        cls: "doms-extra-value",
        text: `${row.sets} ${row.sets === 1 ? "set" : "sets"}`,
      });
    }
  }

  private renderVolume(
    body: HTMLElement,
    sessions: readonly SessionRecord[],
  ): void {
    this.section(body, "All time volume");

    const totals = cumulativeVolume(sessions);
    const most = totals[0]?.sets ?? 0;

    this.addChild(
      new BarList(body, {
        emptyText: "Nothing logged yet.",
        rows: totals.map((total) => ({
          label: total.label,
          fraction: most > 0 ? total.sets / most : 0,
          value: `${total.sets}`,
        })),
      }),
    );
  }

  private section(parent: HTMLElement, title: string, note?: string): void {
    const header = parent.createDiv({ cls: "doms-section" });
    // Section headers are plain text: ASCII banners are one per tab, never on
    // sections within a screen (spec §7).
    header.createEl("h3", { cls: "doms-section-title", text: title });
    if (note) header.createDiv({ cls: "doms-section-note", text: note });
  }
}

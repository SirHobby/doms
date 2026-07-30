import { TAB_LABELS, TabId } from "../../constants";
import {
  cumulativeVolume,
  summarize,
  weeklyHitRate,
  type StatsOptions,
} from "../../data/stats";
import type { SessionRecord } from "../../data/types";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { BarList } from "../stats/bar-list";
import { MonthCalendar } from "../stats/month-calendar";
import { MetricCards } from "../stats/metric-cards";
import { DomsTab, type TabContext } from "./doms-tab";

/** Hit rate is always the trailing twelve weeks. */
const HIT_RATE_WEEKS = 12;

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
    this.renderHitRate(body, sessions, options);
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

  private renderHitRate(
    body: HTMLElement,
    sessions: readonly SessionRecord[],
    options: StatsOptions,
  ): void {
    this.section(
      body,
      "Weekly target hit rate",
      "How often each muscle landed inside the band your plan implies. Diagnostic, not a goal.",
    );

    const rates = weeklyHitRate(sessions, HIT_RATE_WEEKS, options);
    this.addChild(
      new BarList(body, {
        emptyText: "Not enough weeks logged yet.",
        rows: rates
          .filter((rate) => rate.rate !== null)
          .map((rate) => ({
            label: rate.muscle,
            fraction: rate.rate ?? 0,
            value: `${rate.hit} of ${rate.weeks}`,
          })),
      }),
    );
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
          label: total.muscle,
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

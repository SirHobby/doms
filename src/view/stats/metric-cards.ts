import { Component } from "obsidian";
import type { StatsSummary } from "../../data/stats";

/** Four readouts at the top of the Stats tab (spec §4.4). */
export class MetricCards extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly summary: StatsSummary,
  ) {
    super();
  }

  onload(): void {
    const grid = this.parent.createDiv({ cls: "doms-metrics" });
    this.register(() => grid.detach());

    const { summary } = this;
    this.card(grid, "Sessions", summary.totalSessions);
    this.card(grid, "Total sets", summary.totalSets);
    this.card(grid, "Week streak", summary.currentStreak);
    // Best streak stays permanently visible even after a reset — no shaming.
    this.card(grid, "Best streak", summary.bestStreak);
  }

  private card(parent: HTMLElement, label: string, value: number): void {
    const card = parent.createDiv({ cls: "doms-metric" });
    card.createDiv({ cls: "doms-metric-value", text: String(value) });
    card.createDiv({ cls: "doms-metric-label", text: label });
  }
}

import { Component } from "obsidian";
import type { StreakState, WeekState } from "../../data/types";

/** Status line and slot pips (spec §4.1). */
export class WeekSummary extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly week: WeekState,
    private readonly streaks: StreakState,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-summary" });
    this.register(() => root.detach());

    root.createDiv({ cls: "doms-summary-line", text: this.statusText() });
    this.renderPips(root);
  }

  private statusText(): string {
    const { requiredDone, requiredTotal, daysLeft } = this.week;

    const parts = [
      `${requiredDone} of ${requiredTotal} done`,
      `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`,
    ];

    // "6 week streak" — the count modifies "week", so it never pluralizes.
    if (this.streaks.current > 0) {
      parts.push(`${this.streaks.current} week streak`);
    }

    return parts.join(" · ");
  }

  private renderPips(root: HTMLElement): void {
    const pips = root.createDiv({ cls: "doms-pips" });
    // The status line already says "1 of 3 done"; the pips repeat it visually.
    pips.setAttribute("aria-hidden", "true");

    for (const slot of this.week.slots) {
      const pip = pips.createDiv({ cls: "doms-pip" });
      pip.toggleClass("is-done", slot.done);
    }
  }
}

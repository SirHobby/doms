import { Component } from "obsidian";
import { DAY_NAMES, dayOfWeek } from "../../data/dates";
import type { SessionRecord } from "../../data/types";

export interface OtherCardOptions {
  /** Non-gym activity already logged this week. */
  existing: readonly SessionRecord[];
  onOpen: () => void;
}

/**
 * "Log a different workout" — the fourth card on the Week tab.
 *
 * Deliberately not a fourth required slot. §2 makes "three days is the bar" a
 * non-negotiable principle and says extra sessions must never raise it, so this
 * records activity without touching the 3-of-3 count or the streak. It is
 * always available, unlike the bonus affordance.
 */
export class OtherCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: OtherCardOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-other" });
    this.register(() => root.detach());

    for (const session of this.options.existing) {
      const day = DAY_NAMES[dayOfWeek(session.date)];
      const row = root.createDiv({ cls: "doms-slot doms-slot-done" });
      row.createSpan({ cls: "doms-slot-check", text: "•" });
      row.createSpan({
        cls: "doms-slot-name",
        text: session.activity ?? "Different workout",
      });
      row.createSpan({ cls: "doms-slot-meta", text: day });
    }

    const card = root.createEl("button", { cls: "doms-bonus-card" });
    card.type = "button";
    card.createSpan({
      cls: "doms-bonus-title",
      text: "Log a different workout",
    });
    card.createSpan({
      cls: "doms-bonus-hint",
      text: "Bike ride, hike, pickleball, climbing…",
    });

    this.registerDomEvent(card, "click", () => this.options.onOpen());
  }
}

import { Component } from "obsidian";
import { DAY_NAMES, dayOfWeek } from "../../data/dates";
import type { Template } from "../../data/templates";
import type { SessionRecord } from "../../data/types";

export interface BonusCardOptions {
  unlocked: boolean;
  templates: readonly Template[];
  /** Bonus sessions already logged this week. */
  existing: readonly SessionRecord[];
  onOpen: (templateId: string) => void;
}

/**
 * The bonus affordance (spec §4.1): one item, not a fourth requirement, hidden
 * behind the three required slots.
 *
 * Note the spec has a wrinkle here. §2 says a repeated slot logs the second
 * session as a bonus, but §4.1 says bonus is hidden until all three are done —
 * so a bonus session can exist while the affordance is still locked. Resolution
 * taken: the *button* stays locked, but any bonus session that already exists
 * is always shown. Hiding a session the user logged would look like data loss.
 */
export class BonusCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: BonusCardOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-bonus" });
    this.register(() => root.detach());

    for (const session of this.options.existing) {
      const day = DAY_NAMES[dayOfWeek(session.date)];
      const row = root.createDiv({ cls: "doms-slot doms-slot-done" });
      row.createSpan({ cls: "doms-slot-check", text: "★" });
      row.createSpan({ cls: "doms-slot-name", text: "Bonus session" });
      row.createSpan({
        cls: "doms-slot-meta",
        text: `${day} · ${session.totalSets} sets`,
      });
    }

    if (this.options.unlocked) this.renderUnlocked(root);
    else this.renderLocked(root);
  }

  private renderLocked(root: HTMLElement): void {
    const card = root.createDiv({ cls: "doms-bonus-card is-locked" });
    card.createSpan({ cls: "doms-bonus-title", text: "Bonus session" });
    card.createSpan({
      cls: "doms-bonus-hint",
      text: "Unlocks after all three",
    });
  }

  private renderUnlocked(root: HTMLElement): void {
    const card = root.createEl("button", { cls: "doms-bonus-card" });
    card.type = "button";
    card.setAttribute("aria-expanded", "false");
    card.createSpan({ cls: "doms-bonus-title", text: "Bonus session" });
    card.createSpan({ cls: "doms-bonus-hint", text: "Push, pull or legs" });

    this.registerDomEvent(card, "click", () => {
      card.setAttribute("aria-expanded", "true");
      card.detach();
      this.renderPicker(root);
    });
  }

  private renderPicker(root: HTMLElement): void {
    const picker = root.createDiv({ cls: "doms-bonus-picker" });

    for (const template of this.options.templates) {
      const option = picker.createEl("button", {
        cls: "doms-bonus-option",
        text: template.name,
      });
      option.type = "button";
      this.registerDomEvent(option, "click", () =>
        this.options.onOpen(template.id),
      );
    }
  }
}

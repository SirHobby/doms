import { Component } from "obsidian";
import {
  TAB_IDS,
  TAB_LABELS,
  TabId,
  tabButtonId,
  tabPanelId,
} from "../constants";

/**
 * Sticky top tab strip (spec §4). Tabs sit at the top because Obsidian mobile
 * already owns the bottom of the screen with its floating navigation bar.
 *
 * Deliberately tap and keyboard only — no swipe handlers, because Obsidian
 * mobile uses edge swipes to open the sidebars and a gesture here would fight
 * it.
 */
export class TabStrip extends Component {
  private readonly root: HTMLElement;
  private readonly buttons = new Map<TabId, HTMLButtonElement>();

  constructor(
    parent: HTMLElement,
    private readonly onSelect: (id: TabId) => void,
  ) {
    super();

    this.root = parent.createDiv({ cls: "doms-tabstrip" });
    this.root.setAttribute("role", "tablist");
    this.root.setAttribute("aria-label", "D.O.M.S sections");

    for (const id of TAB_IDS) {
      const button = this.root.createEl("button", {
        cls: "doms-tab",
        text: TAB_LABELS[id],
      });
      button.id = tabButtonId(id);
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", tabPanelId(id));
      button.setAttribute("aria-selected", "false");
      button.tabIndex = -1;

      this.registerDomEvent(button, "click", () => this.onSelect(id));
      this.buttons.set(id, button);
    }

    this.registerDomEvent(this.root, "keydown", (event) =>
      this.onKeydown(event),
    );
  }

  setActive(active: TabId): void {
    for (const [id, button] of this.buttons) {
      const selected = id === active;
      button.setAttribute("aria-selected", String(selected));
      button.toggleClass("is-active", selected);
      // Roving tabindex: the strip is a single tab stop.
      button.tabIndex = selected ? 0 : -1;
    }
  }

  private onKeydown(event: KeyboardEvent): void {
    const current = TAB_IDS.findIndex(
      (id) => this.buttons.get(id) === document.activeElement,
    );
    if (current === -1) return;

    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % TAB_IDS.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + TAB_IDS.length) % TAB_IDS.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = TAB_IDS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const id = TAB_IDS[next];
    this.onSelect(id);
    this.buttons.get(id)?.focus();
  }

  onunload(): void {
    this.buttons.clear();
    this.root.detach();
  }
}

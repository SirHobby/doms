import { ItemView, WorkspaceLeaf } from "obsidian";
import {
  DEFAULT_TAB,
  DOMS_DISPLAY_NAME,
  DOMS_ICON,
  TabId,
  VIEW_TYPE_DOMS,
} from "../constants";
import type DomsPlugin from "../main";
import { TabStrip } from "./tab-strip";
import { createTab } from "./tabs";
import { WeekTab } from "./tabs/week-tab";
import type { DomsTab } from "./tabs/doms-tab";

export class DomsView extends ItemView {
  private activeTabId: TabId = DEFAULT_TAB;
  private strip: TabStrip | null = null;
  private tab: DomsTab | null = null;
  private panelHost: HTMLElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: DomsPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_DOMS;
  }

  getDisplayText(): string {
    return DOMS_DISPLAY_NAME;
  }

  getIcon(): string {
    return DOMS_ICON;
  }

  async onOpen(): Promise<void> {
    this.build();
  }

  async onClose(): Promise<void> {
    this.teardown();
    this.containerEl.removeClass("doms-view");
    this.containerEl.removeAttribute("data-doms-theme");
    this.contentEl.removeClass("doms-content");
  }

  /** Called by the plugin when settings change, so edits show up live. */
  refresh(): void {
    this.build();
  }

  /** Jumps to the Week tab and opens a session sheet. */
  quickLog(session?: string): void {
    this.selectTab("week");
    if (this.tab instanceof WeekTab) this.tab.openSession(session);
  }

  private build(): void {
    this.teardown();

    // The variable and theme host is the leaf container, not the scrolling
    // content: overlays (celebration, undo toast) mount outside the scroller so
    // they stay put, and they still need to inherit --doms-*.
    this.containerEl.addClass("doms-view");
    this.applyAccent();

    const root = this.contentEl;
    root.addClass("doms-content");

    const strip = new TabStrip(root, (id) => this.selectTab(id));
    this.addChild(strip);
    this.strip = strip;

    this.panelHost = root.createDiv({ cls: "doms-panelhost" });
    this.mountTab(this.activeTabId);
  }

  /**
   * "Inherit" is the absence of the attribute, not a value — that is what keeps
   * user themes and CSS snippets working untouched (spec §6).
   */
  private applyAccent(): void {
    const { accent } = this.plugin.settings;
    if (accent === "inherit") {
      this.containerEl.removeAttribute("data-doms-theme");
    } else {
      this.containerEl.setAttribute("data-doms-theme", accent);
    }
  }

  private selectTab(id: TabId): void {
    if (id === this.activeTabId && this.tab) return;
    this.activeTabId = id;
    this.mountTab(id);
    this.contentEl.scrollTop = 0;
  }

  private mountTab(id: TabId): void {
    if (this.tab) {
      this.removeChild(this.tab);
      this.tab = null;
    }
    if (!this.panelHost) return;

    const tab = createTab(id);
    this.addChild(tab);
    tab.render(this.panelHost, {
      plugin: this.plugin,
      viewEl: this.containerEl,
    });
    this.tab = tab;

    this.strip?.setActive(id);
  }

  private teardown(): void {
    if (this.tab) {
      this.removeChild(this.tab);
      this.tab = null;
    }
    if (this.strip) {
      this.removeChild(this.strip);
      this.strip = null;
    }
    this.panelHost = null;
    this.contentEl.empty();
  }
}

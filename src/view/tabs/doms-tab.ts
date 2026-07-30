import { Component } from "obsidian";
import { TabId, tabButtonId, tabPanelId } from "../../constants";
import type DomsPlugin from "../../main";
import type { DomsSettings } from "../../settings/types";
import { resolveTitleSize } from "../../settings/types";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { AsciiTitle } from "../../ui/ascii-title";

export interface TabContext {
  plugin: DomsPlugin;
  /**
   * The .doms-view root. Overlays (celebration, undo toast) mount here so they
   * are not clipped by panel padding.
   */
  viewEl: HTMLElement;
}

/** Base for the four tab panels: a banner plus a body. */
export abstract class DomsTab extends Component {
  abstract readonly id: TabId;
  abstract readonly heading: string;
  abstract readonly asciiKey: AsciiKey;
  /** Placeholder copy for tabs whose real body has not landed yet. */
  protected readonly blurb: string = "";

  private root: HTMLElement | null = null;

  /** Assigned by render(), before any subclass body code runs. */
  protected context!: TabContext;

  protected get settings(): DomsSettings {
    return this.context.plugin.settings;
  }

  render(parent: HTMLElement, context: TabContext): void {
    this.context = context;

    const root = parent.createDiv({ cls: `doms-panel doms-panel-${this.id}` });
    root.id = tabPanelId(this.id);
    root.setAttribute("role", "tabpanel");
    root.setAttribute("aria-labelledby", tabButtonId(this.id));
    this.root = root;

    // The banner fits itself to whatever width it is given, so an adornment
    // beside it just makes it narrower. On a small screen the row wraps and the
    // adornment drops underneath.
    const titleRow = root.createDiv({ cls: "doms-titlerow" });
    this.addChild(
      new AsciiTitle(titleRow, {
        key: this.asciiKey,
        heading: this.heading,
        size: resolveTitleSize(context.plugin.settings),
        enabled: context.plugin.settings.asciiTitles,
      }),
    );
    this.renderTitleAdornment(titleRow, context);

    this.renderBody(root, context);
  }

  /** Optional control alongside the banner. Only the Week tab uses one. */
  protected renderTitleAdornment(
    _row: HTMLElement,
    _context: TabContext,
  ): void {}

  protected renderBody(root: HTMLElement, _context: TabContext): void {
    root.createDiv({ cls: "doms-placeholder", text: this.blurb });
  }

  onunload(): void {
    this.root?.detach();
    this.root = null;
  }
}

import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { DOMS_DISPLAY_NAME, DOMS_ICON, VIEW_TYPE_DOMS } from "./constants";
import { DomsData } from "./data/doms-data";
import { DomsSettingTab } from "./settings/settings-tab";
import { DomsSettings, normalizeSettings } from "./settings/types";
import { DomsView } from "./view/doms-view";
import { registerWidgets } from "./widgets/register";

export default class DomsPlugin extends Plugin {
  settings: DomsSettings = normalizeSettings(null);

  /**
   * The data layer. Public so it can be driven from the console before any UI
   * depends on it: app.plugins.plugins.doms.data
   */
  readonly data = new DomsData(this.app, () => ({
    root: this.settings.rootFolder,
    weekStart: this.settings.weekStart,
    planId: this.settings.planId,
  }));

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_DOMS,
      (leaf: WorkspaceLeaf) => new DomsView(leaf, this),
    );

    this.addRibbonIcon(DOMS_ICON, `Open ${DOMS_DISPLAY_NAME}`, () => {
      void this.activateView();
    });

    this.addCommand({
      id: "open-view",
      name: `Open ${DOMS_DISPLAY_NAME}`,
      callback: () => {
        void this.activateView();
      },
    });

    this.addCommand({
      id: "quick-log",
      name: "Quick log a session",
      callback: () => {
        void this.quickLog();
      },
    });

    // A real URL, so an Apple Shortcut on the home screen can reach it without
    // the Advanced URI plugin. It still cold-launches Obsidian: this is "one
    // tap from the home screen to the logging screen", not logging in the
    // background, which a plugin cannot do.
    this.registerObsidianProtocolHandler("doms", (params) => {
      if (params.action && params.action !== "log") {
        void this.activateView();
        return;
      }
      void this.quickLog(params.session);
    });

    registerWidgets(this);

    this.addSettingTab(new DomsSettingTab(this.app, this));
  }

  // No onunload: registerView, registerEvent and the register* helpers already
  // tear everything down. Detaching leaves here would destroy the user's layout
  // on every update, which the plugin guidelines call out specifically.

  /**
   * Straight to the logging screen. Shared by the in-note button, the command
   * palette and the obsidian://doms URL so all three behave identically.
   */
  async quickLog(session?: string): Promise<void> {
    await this.activateView();

    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_DOMS)[0];
    const view = leaf?.view;
    if (view instanceof DomsView) view.quickLog(session);
  }

  /** Opens in the main workspace area, reusing an existing leaf if there is one. */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    const existing = workspace.getLeavesOfType(VIEW_TYPE_DOMS);
    if (existing.length > 0) {
      await workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_DOMS, active: true });
    await workspace.revealLeaf(leaf);
  }

  /** Surfaces a failed write instead of leaving it in the console. */
  reportError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error("D.O.M.S:", error);
    new Notice(message.startsWith("D.O.M.S") ? message : `D.O.M.S: ${message}`);
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshViews();
  }

  /** Push a settings change into every open view without a reload. */
  private refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_DOMS)) {
      const view = leaf.view;
      if (view instanceof DomsView) view.refresh();
    }
  }
}

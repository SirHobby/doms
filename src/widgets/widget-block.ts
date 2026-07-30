import { debounce, MarkdownRenderChild, TAbstractFile } from "obsidian";
import { logFolder } from "../data/paths";
import type DomsPlugin from "../main";

/**
 * Base for a widget embedded in a note.
 *
 * A markdown code block processor fires once when the note renders and then
 * goes silent, so a calendar embedded in a dashboard note goes stale the moment
 * a session is logged in another tab. Repainting on vault changes fixes that.
 *
 * The listeners are registered on the render child rather than on the plugin,
 * which ties them to the lifetime of the block: close the note and they go with
 * it. Registering them on the plugin instead would leak one set per note open,
 * which on mobile shows up as the app getting heavier over a long session.
 */
export abstract class DomsWidgetBlock extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    protected readonly plugin: DomsPlugin,
  ) {
    super(containerEl);
  }

  /** Repaint. Called on load and again whenever the log folder changes. */
  protected abstract paint(): void;

  /** Widgets that do not read the vault can turn the watcher off. */
  protected get watchesVault(): boolean {
    return true;
  }

  onload(): void {
    this.containerEl.addClass("doms-widget");
    this.applyAccent();
    this.paint();

    if (!this.watchesVault) return;

    // Debounced: a single save can fire modify plus a metadata change, and a
    // rename fires for every affected file.
    const refresh = debounce(() => this.paint(), 250, true);
    const onChange = (file: TAbstractFile) => {
      if (this.isLogFile(file)) refresh();
    };

    const { vault, metadataCache } = this.plugin.app;
    this.registerEvent(vault.on("modify", onChange));
    this.registerEvent(vault.on("create", onChange));
    this.registerEvent(vault.on("delete", onChange));
    this.registerEvent(vault.on("rename", onChange));
    // Frontmatter is read through the cache, which settles after the write.
    this.registerEvent(metadataCache.on("changed", onChange));
  }

  /** "Inherit" is the absence of the attribute, exactly as in the view. */
  private applyAccent(): void {
    const { accent } = this.plugin.settings;
    if (accent === "inherit") this.containerEl.removeAttribute("data-doms-theme");
    else this.containerEl.setAttribute("data-doms-theme", accent);
  }

  private isLogFile(file: TAbstractFile): boolean {
    const prefix = `${logFolder(this.plugin.settings.rootFolder)}/`;
    return file.path.startsWith(prefix);
  }

  onunload(): void {
    this.containerEl.empty();
    this.containerEl.removeClass("doms-widget");
    this.containerEl.removeAttribute("data-doms-theme");
  }
}

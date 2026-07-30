import { Component } from "obsidian";

/**
 * Undo affordance after a commit (spec §4.2). Roughly eight seconds, then it
 * gets out of the way.
 *
 * Not an Obsidian Notice: a Notice dismisses on any click, which fights an
 * Undo button living inside it.
 */
const DEFAULT_DURATION_MS = 8000;

export interface UndoToastOptions {
  message: string;
  durationMs?: number;
  onUndo: () => void | Promise<void>;
}

export class UndoToast extends Component {
  private root: HTMLElement | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: UndoToastOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.host.createDiv({ cls: "doms-toast" });
    root.setAttribute("role", "status");
    this.root = root;

    root.createSpan({ cls: "doms-toast-message", text: this.options.message });

    const button = root.createEl("button", {
      cls: "doms-toast-undo",
      text: "Undo",
    });
    button.type = "button";

    this.registerDomEvent(button, "click", async () => {
      // Disable immediately: an undo that runs twice would try to trash a file
      // that is already gone.
      button.disabled = true;
      const { onUndo } = this.options;
      this.unload();
      await onUndo();
    });

    const timer = window.setTimeout(
      () => this.unload(),
      this.options.durationMs ?? DEFAULT_DURATION_MS,
    );
    this.register(() => window.clearTimeout(timer));
  }

  onunload(): void {
    this.root?.detach();
    this.root = null;
  }
}

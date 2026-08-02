import { Component, Notice } from "obsidian";
import {
  categoryFolder,
  groupNotes,
  loadContent,
  type ContentCategory,
  type ContentNote,
} from "../../data/content";
import { seedStarterContent, type SeedMode } from "../../data/seed-content";
import { ConfirmModal } from "../../ui/confirm-modal";
import type DomsPlugin from "../../main";
import { LinkCard, renderVideo } from "./link-card";

export interface ContentPanelOptions {
  plugin: DomsPlugin;
  category: ContentCategory;
  prompt: string;
  /** Shown above everything on the Rehab tab only. */
  disclaimer?: string;
}

/**
 * Ideas and Rehab are the same screen with different content folders (spec
 * §4.6), so they share this component.
 *
 * The picker is a wrapped grid with group headings rather than one pill row:
 * a single row worked for seven categories and falls apart at nineteen.
 * Selection stays one tap either way.
 */
/**
 * Which groups were open, per category, for the lifetime of the app session.
 *
 * A tab switch discards the panel, so without this every trip back to Ideas
 * would collapse everything the user had just opened. Deliberately not
 * persisted to disk: writing it to settings would trigger a view rebuild on
 * every tap, which costs far more than it buys.
 */
const sessionState = new Map<
  ContentCategory,
  { expanded: Set<string>; selected: string | null }
>();

function stateFor(category: ContentCategory) {
  let state = sessionState.get(category);
  if (!state) {
    // Collapsed, nothing selected: the landing state is a short list of
    // headings, not a wall of tabs.
    state = { expanded: new Set<string>(), selected: null };
    sessionState.set(category, state);
  }
  return state;
}

export class ContentPanel extends Component {
  private root: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private cards: Component[] = [];
  private notes: ContentNote[] = [];
  private readonly chipEls = new Map<string, HTMLElement>();
  private readonly state = stateFor(this.options.category);

  private get selected(): string | null {
    return this.state.selected;
  }

  private set selected(slug: string | null) {
    this.state.selected = slug;
  }

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: ContentPanelOptions,
  ) {
    super();
  }

  onload(): void {
    this.root = this.parent.createDiv({ cls: "doms-content-panel" });
    this.register(() => this.root?.detach());
    this.refresh();
  }

  private refresh(): void {
    const { plugin, category } = this.options;
    this.notes = loadContent(plugin.app, plugin.settings.rootFolder, category);

    const root = this.root;
    if (!root) return;

    this.clearCards();
    this.chipEls.clear();
    root.empty();

    if (this.notes.length === 0) {
      this.renderEmpty(root);
      return;
    }

    if (this.options.disclaimer) {
      root.createDiv({ cls: "doms-disclaimer", text: this.options.disclaimer });
    }

    root.createDiv({ cls: "doms-prompt", text: this.options.prompt });

    // Notes written before the frontmatter format existed parse to zero
    // exercises. Rather than silently showing empty categories, say so and
    // offer the one-tap fix.
    if (this.notes.every((note) => note.exercises.length === 0)) {
      this.renderStale(root);
    }

    // A selection remembered from earlier in the session may name a note that
    // has since been deleted or renamed.
    if (this.selected && !this.notes.some((n) => n.slug === this.selected)) {
      this.selected = null;
    }

    this.renderPicker(root);
    this.listEl = root.createDiv({ cls: "doms-card-list" });
    this.paintList();
  }

  /**
   * Collapsible groups, closed by default.
   *
   * Twenty-one categories rendered expanded is a wall of tabs that fills a
   * phone screen before any content does. Five headings fit, and the one you
   * want is one tap away rather than one scroll.
   */
  private renderPicker(root: HTMLElement): void {
    const picker = root.createDiv({ cls: "doms-picker" });

    for (const group of groupNotes(this.notes)) {
      const open = this.state.expanded.has(group.group);

      const header = picker.createEl("button", { cls: "doms-picker-group" });
      header.type = "button";
      header.setAttribute("aria-expanded", String(open));
      header.createSpan({ cls: "doms-picker-caret", text: "›" });
      header.createSpan({ cls: "doms-picker-grouplabel", text: group.label });
      header.createSpan({
        cls: "doms-picker-groupcount",
        text: String(group.notes.length),
      });

      const grid = picker.createDiv({ cls: "doms-chips" });
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", group.label);
      grid.toggleClass("is-collapsed", !open);
      header.toggleClass("is-open", open);

      this.registerDomEvent(header, "click", () => {
        const nowOpen = !this.state.expanded.has(group.group);
        if (nowOpen) this.state.expanded.add(group.group);
        else this.state.expanded.delete(group.group);

        header.setAttribute("aria-expanded", String(nowOpen));
        header.toggleClass("is-open", nowOpen);
        grid.toggleClass("is-collapsed", !nowOpen);
      });

      for (const note of group.notes) {
        const chip = grid.createEl("button", {
          cls: "doms-chip",
          text: note.label,
        });
        chip.type = "button";
        const active = note.slug === this.selected;
        chip.toggleClass("is-selected", active);
        chip.setAttribute("aria-pressed", String(active));

        this.registerDomEvent(chip, "click", () => this.select(note.slug));
        this.chipEls.set(note.slug, chip);
      }
    }
  }

  private select(slug: string): void {
    if (this.selected === slug) return;
    this.selected = slug;

    for (const [other, el] of this.chipEls) {
      const on = other === slug;
      el.toggleClass("is-selected", on);
      el.setAttribute("aria-pressed", String(on));
    }
    this.paintList();
  }

  private paintList(): void {
    const list = this.listEl;
    if (!list) return;

    this.clearCards();
    list.empty();

    // Nothing picked yet, which is the landing state now that groups start
    // closed. Say so rather than leaving the page apparently half-loaded.
    if (!this.selected) {
      list.createDiv({
        cls: "doms-empty",
        text: "Pick a group above to see what's in it.",
      });
      return;
    }

    const note = this.notes.find((n) => n.slug === this.selected);
    if (!note) return;

    const header = list.createDiv({ cls: "doms-section" });
    header.createEl("h3", {
      cls: "doms-section-title",
      text: note.subtitle ?? note.label,
    });

    // A caution is a callout, never a normal paragraph.
    if (note.caution) {
      list.createDiv({ cls: "doms-caution", text: note.caution });
    }
    if (note.note) {
      list.createDiv({ cls: "doms-section-note", text: note.note });
    }

    if (note.videos.length > 0) {
      const videos = list.createDiv({ cls: "doms-video-list" });
      for (const v of note.videos) renderVideo(videos, v);
    }

    if (note.exercises.length === 0) {
      list.createDiv({
        cls: "doms-empty",
        text: "This note has no exercises yet. Add them to the exercises list in its frontmatter.",
      });
    }

    for (const exercise of note.exercises) {
      const card = new LinkCard(list, exercise);
      this.addChild(card);
      this.cards.push(card);
    }

    // The affordance that turns a static library into something users maintain.
    const edit = list.createEl("button", {
      cls: "doms-button doms-button-secondary",
      text: "Edit this list",
    });
    edit.type = "button";
    this.registerDomEvent(edit, "click", () => {
      void this.options.plugin.app.workspace.getLeaf("tab").openFile(note.file);
    });
  }

  /** Every category parsed empty: the files are in the old markdown-list format. */
  private renderStale(root: HTMLElement): void {
    const box = root.createDiv({ cls: "doms-caution" });
    box.createDiv({
      text: "These notes are in the old format, so their exercises and videos cannot be read. Replacing them restores the full library.",
    });

    const button = box.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: "Update starter content",
    });
    button.type = "button";

    this.registerDomEvent(button, "click", () => {
      new ConfirmModal(this.options.plugin.app, {
        title: "Replace starter content?",
        body: [
          "This overwrites the starter notes with the current versions, including the exercise lists and video links.",
          "Only notes D.O.M.S originally created are touched. Any note you added yourself is left alone — but your edits to a starter note will be lost.",
          "Categories from older versions that no longer exist are moved to your vault trash, not deleted outright.",
        ],
        confirmText: "Replace",
        cancelText: "Keep as is",
        onConfirm: () => this.seed("replace", button),
      }).open();
    });
  }

  private async seed(mode: SeedMode, button: HTMLButtonElement): Promise<void> {
    const { plugin } = this.options;
    const original = button.textContent ?? "";

    button.disabled = true;
    button.setText(mode === "replace" ? "Replacing…" : "Adding…");

    try {
      const r = await seedStarterContent(plugin.app, plugin.settings.rootFolder, mode);
      new Notice(
        `D.O.M.S: ${r.created} added, ${r.replaced} replaced, ${r.skipped} kept` +
          (r.removed > 0 ? `, ${r.removed} superseded moved to trash.` : "."),
      );
      // The metadata cache needs a moment to reindex the rewritten files.
      window.setTimeout(() => this.refresh(), 500);
    } catch (error) {
      plugin.reportError(error);
      button.disabled = false;
      button.setText(original);
    }
  }

  private renderEmpty(root: HTMLElement): void {
    const { plugin, category } = this.options;
    const folder = categoryFolder(plugin.settings.rootFolder, category);

    root.createDiv({
      cls: "doms-empty",
      text: `No content in ${folder} yet. Starter content is a set of markdown notes you own and can edit — nothing is overwritten if you add your own first.`,
    });

    const button = root.createEl("button", {
      cls: "doms-button doms-button-primary",
      text: "Add starter content",
    });
    button.type = "button";

    this.registerDomEvent(button, "click", () => {
      void this.seed("create", button);
    });
  }

  private clearCards(): void {
    for (const card of this.cards) this.removeChild(card);
    this.cards = [];
  }

  onunload(): void {
    this.cards = [];
    this.chipEls.clear();
    this.listEl = null;
    this.root = null;
  }
}

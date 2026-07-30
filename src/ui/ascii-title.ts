import { Component } from "obsidian";
import { ASCII_COMPACT, ASCII_FULL, AsciiKey } from "./ascii-fonts";
import type { ResolvedTitleSize } from "../settings/types";

/**
 * Monospace glyphs are roughly 0.6em wide, so the banner fits when
 * fontSize = containerWidth / (columns * 0.6). Spec §7.
 */
const MONOSPACE_ADVANCE = 0.6;

/** Below this the banner is unreadable; better to clip than to render mush. */
const MIN_FONT_PX = 7;

/**
 * Width-fitting alone does not make the compact font shorter: fewer columns
 * means a bigger font size, so a 3-row banner ends up nearly as tall as a
 * 5-row one. Capping the size is what actually buys back vertical space.
 */
const MAX_FONT_PX = 28;

export interface AsciiTitleOptions {
  key: AsciiKey;
  /** Real heading text, read by screen readers. */
  heading: string;
  size: ResolvedTitleSize;
  /** When false, renders a plain visible heading instead of the banner. */
  enabled: boolean;
}

export class AsciiTitle extends Component {
  private readonly root: HTMLElement;
  private pre: HTMLPreElement | null = null;
  private columns = 1;

  constructor(parent: HTMLElement, options: AsciiTitleOptions) {
    super();
    this.root = parent.createDiv({ cls: "doms-ascii" });

    if (!options.enabled) {
      this.root.createEl("h2", {
        cls: "doms-ascii-plain",
        text: options.heading,
      });
      return;
    }

    // Block art read aloud is a stream of slashes, so the banner is hidden from
    // assistive tech and a real heading sits next to it.
    this.root.createEl("h2", {
      cls: "doms-visually-hidden",
      text: options.heading,
    });

    const art =
      options.size === "compact"
        ? ASCII_COMPACT[options.key]
        : ASCII_FULL[options.key];

    const lines = art.split("\n");
    this.columns = Math.max(...lines.map((line) => line.length));

    const pre = this.root.createEl("pre", { cls: "doms-ascii-art" });
    pre.setAttribute("aria-hidden", "true");
    pre.setText(art);
    this.pre = pre;

    const observer = new ResizeObserver(() => this.fit());
    observer.observe(this.root);
    this.register(() => observer.disconnect());

    this.fit();
  }

  private fit(): void {
    const pre = this.pre;
    if (!pre) return;

    const width = this.root.clientWidth;
    // Zero while the leaf is still hidden. The observer fires again on reveal.
    if (width <= 0) return;

    const ideal = width / (this.columns * MONOSPACE_ADVANCE);
    const size = Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, ideal));
    pre.style.fontSize = `${size.toFixed(2)}px`;
  }

  onunload(): void {
    this.root.detach();
    this.pre = null;
  }
}

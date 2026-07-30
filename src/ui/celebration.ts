import { Component } from "obsidian";

/**
 * Tier one celebration (spec §4.3): CSS and inline SVG only.
 *
 * Community plugins ship main.js, manifest.json and styles.css — binary assets
 * cannot be bundled — so the always-available tier has to be drawn, not loaded.
 * No network, no files, never fails.
 */
export type CelebrationTier = "session" | "week" | "streak";

const MESSAGES: Record<CelebrationTier, readonly string[]> = {
  session: [
    "Great job hitting the gym!",
    "That's another one banked.",
    "You showed up. That's the whole game.",
    "Logged. Nice work.",
    "Consistency beats intensity.",
  ],
  week: [
    "Three for three. Week complete!",
    "That's the bar cleared.",
    "Full week. Take the win.",
  ],
  streak: [
    "Streak extended!",
    "Another week on the board.",
    "You keep showing up.",
  ],
};

/** Milestone scaling is what stops the animation going stale by session thirty. */
const DURATIONS: Record<CelebrationTier, number> = {
  session: 800,
  streak: 1200,
  week: 1400,
};

const RAY_COUNT = 12;

let lastIndex = -1;

function pickMessage(tier: CelebrationTier): string {
  const pool = MESSAGES[tier];
  let index = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && index === lastIndex) index = (index + 1) % pool.length;
  lastIndex = index;
  return pool[index];
}

export interface CelebrationOptions {
  tier: CelebrationTier;
  /** Appended to the message for a streak, e.g. "6 weeks running". */
  detail?: string;
  /**
   * Tier two: a resource URL for one of the user's own images. When absent the
   * drawn animation runs instead, which is always available and never fails.
   */
  imageUrl?: string | null;
}

export class Celebration extends Component {
  private root: HTMLElement | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly options: CelebrationOptions,
  ) {
    super();
  }

  onload(): void {
    const { tier } = this.options;

    const root = this.host.createDiv({
      cls: `doms-celebration doms-celebration-${tier}`,
    });
    // Decorative and non-blocking: taps pass straight through to whatever the
    // user wants to do next.
    root.setAttribute("aria-hidden", "true");
    this.root = root;

    if (this.options.imageUrl) {
      const frame = root.createDiv({ cls: "doms-celebration-image" });
      const img = frame.createEl("img");
      img.src = this.options.imageUrl;
      img.alt = "";
      this.renderMessage(root, tier);
      this.scheduleDismiss(tier);
      return;
    }

    const burst = root.createDiv({ cls: "doms-celebration-burst" });
    const svg = burst.createSvg("svg", {
      attr: { viewBox: "0 0 100 100", focusable: "false" },
      cls: "doms-celebration-svg",
    });

    svg.createSvg("circle", {
      attr: { cx: "50", cy: "50", r: "18", class: "doms-celebration-ring" },
    });

    for (let i = 0; i < RAY_COUNT; i++) {
      const angle = (i / RAY_COUNT) * Math.PI * 2;
      const x1 = 50 + Math.cos(angle) * 26;
      const y1 = 50 + Math.sin(angle) * 26;
      const x2 = 50 + Math.cos(angle) * 40;
      const y2 = 50 + Math.sin(angle) * 40;
      svg.createSvg("line", {
        attr: {
          x1: x1.toFixed(2),
          y1: y1.toFixed(2),
          x2: x2.toFixed(2),
          y2: y2.toFixed(2),
          class: "doms-celebration-ray",
          style: `--doms-ray-delay: ${i * 12}ms`,
        },
      });
    }

    this.renderMessage(root, tier);
    this.scheduleDismiss(tier);
  }

  private renderMessage(root: HTMLElement, tier: CelebrationTier): void {
    const message = pickMessage(tier);
    root.createDiv({
      cls: "doms-celebration-message",
      text: this.options.detail ? `${message} ${this.options.detail}` : message,
    });

    // Announce to screen readers separately, since the visual is aria-hidden.
    const live = this.host.createDiv({ cls: "doms-visually-hidden" });
    live.setAttribute("role", "status");
    live.setText(message);
    this.register(() => live.detach());
  }

  private scheduleDismiss(tier: CelebrationTier): void {
    const timer = window.setTimeout(() => this.unload(), DURATIONS[tier]);
    this.register(() => window.clearTimeout(timer));

    // Dismissible on tap. The overlay itself ignores pointers, so this listens
    // on the host instead of swallowing the gesture.
    this.registerDomEvent(this.host, "pointerdown", () => this.unload());
  }

  onunload(): void {
    this.root?.detach();
    this.root = null;
  }
}

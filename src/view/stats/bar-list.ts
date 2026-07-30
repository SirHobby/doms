import { Component } from "obsidian";

export interface BarRow {
  label: string;
  /** 0-1. Drives the bar width. */
  fraction: number;
  /** Right hand readout, e.g. "8 of 12" or "84 sets". */
  value: string;
}

export interface BarListOptions {
  rows: readonly BarRow[];
  emptyText: string;
}

/**
 * Horizontal bars, shared by the weekly hit rate and the all time volume
 * sections. Both are the same shape: a label, a proportion, a number.
 */
export class BarList extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly options: BarListOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-bars" });
    this.register(() => root.detach());

    if (this.options.rows.length === 0) {
      root.createDiv({ cls: "doms-empty", text: this.options.emptyText });
      return;
    }

    for (const row of this.options.rows) {
      const line = root.createDiv({ cls: "doms-bar-row" });
      line.createSpan({ cls: "doms-bar-label", text: row.label });

      const track = line.createDiv({ cls: "doms-bar-track" });
      const fill = track.createDiv({ cls: "doms-bar-fill" });
      const percent = Math.round(clamp(row.fraction) * 100);
      fill.style.width = `${percent}%`;

      line.createSpan({ cls: "doms-bar-value", text: row.value });
    }
  }
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

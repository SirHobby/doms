import { Component } from "obsidian";

export interface StepperOptions {
  label: string;
  value: number;
  /** Sets the template suggests. Shown alongside the count as a target. */
  goal?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/**
 * One muscle group row in the session sheet: minus, count, plus.
 *
 * The count starts at zero and you tally sets as you do them, so the number on
 * screen is what actually happened rather than what was planned. The template's
 * suggested count rides alongside as a goal.
 */
export class Stepper extends Component {
  private value: number;
  private countEl: HTMLElement | null = null;
  private goalEl: HTMLElement | null = null;
  private minusEl: HTMLButtonElement | null = null;
  private plusEl: HTMLButtonElement | null = null;
  private rowEl: HTMLElement | null = null;

  private readonly min: number;
  private readonly max: number;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: StepperOptions,
  ) {
    super();
    this.value = options.value;
    this.min = options.min ?? 0;
    this.max = options.max ?? 30;
  }

  onload(): void {
    const row = this.parent.createDiv({ cls: "doms-stepper" });
    this.register(() => row.detach());
    this.rowEl = row;

    const head = row.createDiv({ cls: "doms-stepper-head" });
    const labelId = `doms-stepper-${this.options.label.replace(/\s+/g, "-")}`;
    head.createSpan({
      cls: "doms-stepper-label",
      text: this.options.label,
      attr: { id: labelId },
    });

    if (this.options.goal !== undefined) {
      this.goalEl = head.createSpan({
        cls: "doms-stepper-goal",
        text: `goal ${this.options.goal}`,
      });
    }

    const controls = row.createDiv({ cls: "doms-stepper-controls" });
    this.minusEl = this.button(controls, "−", `One less set of ${this.options.label}`, -1);

    this.countEl = controls.createSpan({ cls: "doms-stepper-count" });
    this.countEl.setAttribute("role", "status");
    this.countEl.setAttribute("aria-labelledby", labelId);

    this.plusEl = this.button(controls, "+", `One more set of ${this.options.label}`, 1);

    this.paint();
  }

  private button(
    parent: HTMLElement,
    glyph: string,
    label: string,
    delta: number,
  ): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: "doms-stepper-button",
      text: glyph,
    });
    button.type = "button";
    button.setAttribute("aria-label", label);
    this.registerDomEvent(button, "click", () => this.nudge(delta));
    return button;
  }

  private nudge(delta: number): void {
    const next = Math.min(this.max, Math.max(this.min, this.value + delta));
    if (next === this.value) return;
    this.value = next;
    this.paint();
    this.options.onChange(next);
  }

  private paint(): void {
    const { goal } = this.options;

    this.countEl?.setText(String(this.value));
    if (this.minusEl) this.minusEl.disabled = this.value <= this.min;
    if (this.plusEl) this.plusEl.disabled = this.value >= this.max;

    if (goal === undefined) return;

    // Hitting the goal is the small win worth showing; going past it is fine.
    const met = this.value >= goal && goal > 0;
    this.rowEl?.toggleClass("is-met", met);
    this.goalEl?.setText(met ? `goal ${goal} ✓` : `goal ${goal}`);
  }
}

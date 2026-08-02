import { Component, type App } from "obsidian";
import { type CivilDate, type WeekDay } from "../../data/dates";
import { templateTotal, type Template } from "../../data/templates";
import { SheetHeader } from "./sheet-header";

export interface WorkoutPickerOptions {
  /** Every workout that can be logged, in the order to offer them. */
  templates: readonly Template[];
  app: App;
  weekStart: WeekDay;
  /** The day chosen before this screen opened. */
  date: CivilDate;
  onBack: () => void;
  /** The date is read at tap time, so changing it here still counts. */
  onPick: (templateId: string, date: CivilDate) => void;
}

/**
 * "Which workout was it?" — the middle step of logging a previous session.
 *
 * The date is not fixed once chosen: it sits in the same header every other
 * sheet uses, so getting it wrong costs one tap rather than a trip back.
 */
export class WorkoutPicker extends Component {
  private header: SheetHeader | null = null;

  constructor(
    private readonly parent: HTMLElement,
    private readonly options: WorkoutPickerOptions,
  ) {
    super();
  }

  onload(): void {
    const root = this.parent.createDiv({ cls: "doms-sheet" });
    this.register(() => root.detach());

    this.header = new SheetHeader(root, {
      title: "Log a previous workout",
      app: this.options.app,
      weekStart: this.options.weekStart,
      date: this.options.date,
      onBack: () => this.options.onBack(),
    });
    this.addChild(this.header);

    const list = root.createDiv({ cls: "doms-picker-list" });

    for (const template of this.options.templates) {
      const button = list.createEl("button", { cls: "doms-slot doms-slot-open" });
      button.type = "button";
      button.createSpan({ cls: "doms-slot-name", text: template.name });

      const total = templateTotal(template);
      if (total > 0) {
        button.createSpan({ cls: "doms-slot-meta", text: `${total} sets` });
      }

      this.registerDomEvent(button, "click", () =>
        this.options.onPick(template.id, this.header?.value ?? this.options.date),
      );
    }
  }
}

import { Modal, type App } from "obsidian";
import {
  muscleSections,
  type MuscleGroup,
  type MuscleGroupDef,
} from "../data/muscles";

export interface MusclePickerOptions {
  /** Body parts already on the sheet. Offering them twice makes no sense. */
  exclude: ReadonlySet<MuscleGroup>;
  onPick: (muscle: MuscleGroupDef) => void;
}

/**
 * "What else did you train?" — every body part on the canonical list, grouped.
 *
 * Grouped rather than one flat scroll because the list runs to twenty-six
 * entries: push, pull and legs first because that is what most extras are, then
 * rehab and accessory work, which is the long tail you scroll to on purpose.
 *
 * Tracked and untracked are offered together and look identical here. The
 * distinction is about whether a weekly goal exists, not about whether the work
 * is worth logging, so the picker has no reason to rank them.
 */
export class MusclePickerModal extends Modal {
  constructor(
    app: App,
    private readonly options: MusclePickerOptions,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    // Modals render outside the view, so they need the variable host to pick up
    // the plugin's accent.
    modalEl.addClass("doms-view");
    modalEl.addClass("doms-musclepicker");

    this.titleEl.setText("Add a body part");

    const sections = muscleSections(this.options.exclude);

    if (sections.length === 0) {
      contentEl.createDiv({
        cls: "doms-empty",
        text: "Every body part is already on this session.",
      });
      return;
    }

    const picker = contentEl.createDiv({ cls: "doms-picker" });

    for (const section of sections) {
      picker.createDiv({ cls: "doms-picker-group", text: section.label });

      const grid = picker.createDiv({ cls: "doms-chips" });
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", section.label);

      for (const muscle of section.muscles) {
        const chip = grid.createEl("button", {
          cls: "doms-chip",
          text: muscle.label,
        });
        chip.type = "button";
        chip.addEventListener("click", () => {
          this.options.onPick(muscle);
          this.close();
        });
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
    this.modalEl.removeClass("doms-view");
    this.modalEl.removeClass("doms-musclepicker");
  }
}

import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type DomsPlugin from "../main";
import { DAY_NAMES, isWeekDay } from "../data/dates";
import { DEFAULT_ROOT_FOLDER, normalizeRoot } from "../data/paths";
import { findPlan, PLANS, type Plan } from "../data/plans";
import { findTemplate } from "../data/templates";
import { celebrationImages } from "../data/celebration-media";
import { exportQuoteBank, QUOTES_FILENAME } from "../data/quote-store";
import { seedStarterContent } from "../data/seed-content";
import { ConfirmModal } from "../ui/confirm-modal";
import {
  ACCENT_LABELS,
  ACCENT_PRESETS,
  AccentSetting,
  CELEBRATION_MODE_LABELS,
  CelebrationMode,
  TITLE_SIZE_LABELS,
  TitleSize,
} from "./types";

export class DomsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: DomsPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderPlan(containerEl);
    this.renderAppearance(containerEl);
    this.renderCelebration(containerEl);
    this.renderStorage(containerEl);
  }

  private renderPlan(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Plan").setHeading();

    const plan = findPlan(this.plugin.settings.planId);

    new Setting(containerEl)
      .setName("Weekly routine")
      .setDesc(this.planDesc(plan))
      .addDropdown((dropdown) => {
        for (const option of PLANS) dropdown.addOption(option.id, option.name);
        dropdown
          .setValue(plan.id)
          .onChange(async (value) => {
            const previous = this.plugin.settings.planId;
            this.plugin.settings.planId = value;
            await this.plugin.saveSettings();
            this.offerPlanStamp(previous);
            // The description and slot count both change, so redraw.
            this.display();
          });
      });

    new Setting(containerEl)
      .setName("Week start day")
      .setDesc(
        "The week boundary is fixed, not a rolling seven day window — the reset is what makes three sessions feel completable.",
      )
      .addDropdown((dropdown) => {
        DAY_NAMES.forEach((name, index) => {
          dropdown.addOption(String(index), name);
        });
        dropdown
          .setValue(String(this.plugin.settings.weekStart))
          .onChange(async (value) => {
            const day = Number(value);
            if (!isWeekDay(day)) return;
            this.plugin.settings.weekStart = day;
            await this.plugin.saveSettings();
            this.offerWeekKeyRepair();
          });
      });
  }

  /**
   * Sessions record the plan they were logged under, so switching routines does
   * not rewrite history. Notes written before that field existed have no plan,
   * though, and would be judged by whatever is selected later — so at the moment
   * of a switch, offer to stamp them with the plan just left behind.
   */
  private offerPlanStamp(previousPlanId: string): void {
    const missing = this.plugin.data.store.sessionsMissingPlan();
    if (missing.length === 0) return;

    const previous = findPlan(previousPlanId);
    const count = `${missing.length} session note${missing.length === 1 ? "" : "s"}`;

    new ConfirmModal(this.app, {
      title: "Keep your history accurate?",
      body: [
        `${count} were logged before D.O.M.S recorded which routine you were following.`,
        `Marking them as "${previous.name}" keeps your streaks and targets true to what you actually did, instead of judging those weeks against the routine you just switched to.`,
        "Only the plan field is written. Nothing else in those notes changes.",
      ],
      confirmText: `Mark as ${previous.name}`,
      cancelText: "Leave them",
      onConfirm: async () => {
        try {
          const n = await this.plugin.data.store.stampPlan(previous.id);
          new Notice(`D.O.M.S: marked ${n} session${n === 1 ? "" : "s"} as ${previous.name}.`);
        } catch (error) {
          this.plugin.reportError(error);
        }
      },
    }).open();
  }

  /** Spells out what the chosen plan actually asks of you. */
  private planDesc(plan: Plan): DocumentFragment {
    const frag = new DocumentFragment();
    frag.appendText(plan.description);
    frag.createEl("br");

    const counts = new Map<string, number>();
    for (const id of plan.slots) counts.set(id, (counts.get(id) ?? 0) + 1);

    const parts: string[] = [];
    for (const [id, n] of counts) {
      const name = findTemplate(id, this.plugin.data.templates)?.name ?? id;
      parts.push(n > 1 ? `${name} x${n}` : name);
    }
    frag.createEl("strong", {
      text: `${plan.slots.length} sessions a week: `,
    });
    frag.appendText(parts.join(", "));
    frag.createEl("br");
    frag.appendText(
      "Each session records the routine you were following, so switching later leaves past weeks judged by what you actually did.",
    );
    return frag;
  }

  /**
   * The `week` value stored on every session note is computed from the week
   * start day, and it exists so Dataview and Bases can roll up without date
   * math. Changing the setting therefore makes every note on disk disagree with
   * the plugin — which reads fine here, because week keys are recomputed, but
   * silently breaks the user's own queries. So offer to repair.
   */
  private offerWeekKeyRepair(): void {
    const stale = this.plugin.data.store.staleSessions();
    if (stale.length === 0) return;

    const count = `${stale.length} session note${stale.length === 1 ? "" : "s"}`;

    new ConfirmModal(this.app, {
      title: "Update stored week keys?",
      body: [
        `${count} still store a week key from the previous week start day.`,
        "D.O.M.S itself is unaffected — it recomputes weeks from each session's date. This only matters for your own Dataview or Bases queries that read the week field.",
        "Updating rewrites only that one field. Your notes and any other frontmatter are left alone.",
      ],
      confirmText: `Update ${stale.length}`,
      cancelText: "Leave them",
      onConfirm: async () => {
        const changed = await this.plugin.data.store.rewriteWeekKeys();
        new Notice(`D.O.M.S: updated ${changed} week key${changed === 1 ? "" : "s"}.`);
      },
    }).open();
  }

  private renderAppearance(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Appearance").setHeading();

    new Setting(containerEl)
      .setName("Accent color")
      .setDesc(this.accentDesc())
      .addDropdown((dropdown) => {
        dropdown.addOption("inherit", ACCENT_LABELS.inherit);
        for (const preset of ACCENT_PRESETS) {
          dropdown.addOption(preset, ACCENT_LABELS[preset]);
        }
        dropdown
          .setValue(this.plugin.settings.accent)
          .onChange(async (value) => {
            this.plugin.settings.accent = value as AccentSetting;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("ASCII titles")
      .setDesc(
        "Show a block letter banner at the top of each tab. Turn this off for a plain heading.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.asciiTitles)
          .onChange(async (value) => {
            this.plugin.settings.asciiTitles = value;
            await this.plugin.saveSettings();
            // The size row below is only meaningful while banners are on.
            this.display();
          }),
      );

    new Setting(containerEl)
      .setName("Title size")
      .setDesc(
        "Compact is three rows, full is five. Auto picks compact on mobile.",
      )
      .addDropdown((dropdown) => {
        for (const size of ["auto", "compact", "full"] as TitleSize[]) {
          dropdown.addOption(size, TITLE_SIZE_LABELS[size]);
        }
        dropdown
          .setValue(this.plugin.settings.titleSize)
          .setDisabled(!this.plugin.settings.asciiTitles)
          .onChange(async (value) => {
            this.plugin.settings.titleSize = value as TitleSize;
            await this.plugin.saveSettings();
          });
      });
  }

  private renderCelebration(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Celebration").setHeading();

    new Setting(containerEl)
      .setName("Style")
      .setDesc(
        "The built-in animation is drawn in CSS, so it always works offline. Point it at a folder to use your own images or gifs instead.",
      )
      .addDropdown((dropdown) => {
        for (const mode of ["animation", "folder"] as CelebrationMode[]) {
          dropdown.addOption(mode, CELEBRATION_MODE_LABELS[mode]);
        }
        dropdown
          .setValue(this.plugin.settings.celebrationMode)
          .onChange(async (value) => {
            this.plugin.settings.celebrationMode =
              value === "folder" ? "folder" : "animation";
            await this.plugin.saveSettings();
            this.display();
          });
      });

    const folderSetting = new Setting(containerEl)
      .setName("Image folder")
      .setDesc(this.celebrationFolderDesc())
      .addText((text) =>
        text
          .setPlaceholder("DOMS/celebrations")
          .setValue(this.plugin.settings.celebrationFolder)
          .onChange(async (value) => {
            this.plugin.settings.celebrationFolder = value.trim();
            await this.plugin.saveSettings();
            folderSetting.setDesc(this.celebrationFolderDesc());
          }),
      );

    if (this.plugin.settings.celebrationMode !== "folder") {
      folderSetting.setDisabled(true);
    }
  }

  /** Live count, so a typo in the path is obvious immediately. */
  private celebrationFolderDesc(): string {
    const folder = this.plugin.settings.celebrationFolder.trim();
    if (!folder) {
      return "A folder in your vault holding png, jpg, gif or webp files. One is picked at random per session.";
    }
    const count = celebrationImages(this.app, folder).length;
    return count === 0
      ? `No images found in ${folder}. Drop png, jpg, gif or webp files there; the animation is used until then.`
      : `${count} image${count === 1 ? "" : "s"} found in ${folder}. One is picked at random per session.`;
  }

  private renderStorage(containerEl: HTMLElement): void {
    new Setting(containerEl).setName("Storage").setHeading();

    new Setting(containerEl)
      .setName("Root folder")
      .setDesc(
        "Where sessions and content live. Sessions are plain markdown, so your training history stays queryable and portable if this plugin disappears.",
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_ROOT_FOLDER)
          .setValue(this.plugin.settings.rootFolder)
          .onChange(async (value) => {
            // Normalized on save rather than on keystroke, so typing a slash
            // mid-path does not fight the user.
            this.plugin.settings.rootFolder = normalizeRoot(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Seed starter content")
      .setDesc(
        "Writes the Ideas and Rehab notes into your vault. Idempotent: any note you already have is left exactly as it is.",
      )
      .addButton((button) =>
        button.setButtonText("Seed").onClick(async () => {
          try {
            const result = await seedStarterContent(
              this.app,
              this.plugin.settings.rootFolder,
            );
            new Notice(
              `D.O.M.S: ${result.created} added, ${result.skipped} kept.`,
            );
          } catch (error) {
            this.plugin.reportError(error);
          }
        }),
      );

    new Setting(containerEl)
      .setName("Export motivation quotes")
      .setDesc(
        `Writes the built-in quote bank to ${QUOTES_FILENAME} in your root folder. Edit it and the plugin uses yours instead; delete it and the built-in list comes back.`,
      )
      .addButton((button) =>
        button.setButtonText("Export").onClick(async () => {
          try {
            const r = await exportQuoteBank(
              this.app,
              this.plugin.settings.rootFolder,
            );
            new Notice(`D.O.M.S: wrote ${r.count} quotes to ${r.path}`);
          } catch (error) {
            this.plugin.reportError(error);
          }
        }),
      );

    new Setting(containerEl)
      .setName("Replace starter content")
      .setDesc(
        "Overwrites the starter notes with the current versions. Use this after an update changes the content format. Notes you added yourself are untouched, but your edits to a starter note will be lost.",
      )
      .addButton((button) =>
        button.setButtonText("Replace").setWarning().onClick(() => {
          new ConfirmModal(this.app, {
            title: "Replace starter content?",
            body: [
              "This rewrites every note D.O.M.S originally created, restoring the current exercise lists and video links.",
              "Notes you added yourself are left alone. Edits you made to a starter note will be lost.",
              "Categories from older versions that no longer exist are moved to your vault trash, not deleted outright.",
            ],
            confirmText: "Replace",
            cancelText: "Keep as is",
            onConfirm: async () => {
              try {
                const r = await seedStarterContent(
                  this.app,
                  this.plugin.settings.rootFolder,
                  "replace",
                );
                new Notice(
                  `D.O.M.S: ${r.replaced} replaced, ${r.created} added` +
                    (r.removed > 0 ? `, ${r.removed} superseded moved to trash.` : "."),
                );
              } catch (error) {
                this.plugin.reportError(error);
              }
            },
          }).open();
        }),
      );

    new Setting(containerEl)
      .setName("Create folders")
      .setDesc(
        "Makes the root, log and content folders now. Safe to run repeatedly; nothing is overwritten.",
      )
      .addButton((button) =>
        button.setButtonText("Create").onClick(async () => {
          try {
            await this.plugin.data.ensureFolders();
            new Notice(`D.O.M.S: folders ready in ${this.plugin.settings.rootFolder}`);
          } catch (error) {
            new Notice(String(error instanceof Error ? error.message : error));
          }
        }),
      );
  }

  /** Spec §6: tell power users the selector to target. */
  private accentDesc(): DocumentFragment {
    const frag = new DocumentFragment();
    frag.appendText(
      "Inherit uses your theme's accent and is the default. Presets are scoped to the plugin and cannot leak into the rest of your vault. To set your own, target ",
    );
    frag.createEl("code", { text: ".doms-view { --doms-accent: … }" });
    frag.appendText(" in a CSS snippet.");
    return frag;
  }
}

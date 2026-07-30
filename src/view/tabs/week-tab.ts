import { Component } from "obsidian";
import { TAB_LABELS, TabId } from "../../constants";
import { bonusTemplatesFor } from "../../data/plans";
import {
  CARDIO_ACTIVITIES,
  DEFAULT_ACTIVITIES,
  findTemplate,
  OTHER_TEMPLATE_ID,
  type MuscleGroup,
} from "../../data/templates";
import { orderSlots, suggestNext } from "../../data/suggest";
import type { SessionRecord, StreakState, WeekState } from "../../data/types";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { pickCelebrationImage } from "../../data/celebration-media";
import { Celebration, type CelebrationTier } from "../../ui/celebration";
import { UndoToast } from "../../ui/undo-toast";
import { ActivitySheet } from "../week/activity-sheet";
import { BonusCard } from "../week/bonus-card";
import { OtherCard } from "../week/other-card";
import { SessionSheet } from "../week/session-sheet";
import { SlotCard } from "../week/slot-card";
import { WeekSummary } from "../week/week-summary";
import { MotivationModal } from "../../ui/motivation-modal";
import { DomsTab, type TabContext } from "./doms-tab";

export class WeekTab extends DomsTab {
  readonly id: TabId = "week";
  readonly heading = TAB_LABELS.week;
  readonly asciiKey: AsciiKey = "WEEK";

  private bodyEl: HTMLElement | null = null;
  /** Children of the body only, so a re-render does not tear down the banner. */
  private bodyChildren: Component[] = [];

  /**
   * Entry point for quick log. An unknown or missing session lands on the week
   * rather than failing, so a bad URL still gets you somewhere useful.
   */
  openSession(templateId?: string): void {
    if (!templateId) {
      this.showWeek();
      return;
    }
    const template = findTemplate(templateId, this.context.plugin.data.templates);
    if (template) this.showSheet(template.id);
    else this.showWeek();
  }

  protected renderTitleAdornment(row: HTMLElement, context: TabContext): void {
    const button = row.createEl("button", {
      cls: "doms-motivate",
      text: "Need motivation?",
    });
    button.type = "button";
    this.registerDomEvent(button, "click", () => {
      new MotivationModal(context.plugin).open();
    });
  }

  protected renderBody(root: HTMLElement, _context: TabContext): void {
    this.bodyEl = root.createDiv({ cls: "doms-week" });
    this.showWeek();
  }

  /** Unloads everything the body owns before rebuilding it. */
  private resetBody(): HTMLElement | null {
    for (const child of this.bodyChildren) this.removeChild(child);
    this.bodyChildren = [];
    this.bodyEl?.empty();
    return this.bodyEl;
  }

  private mount<T extends Component>(child: T): T {
    this.addChild(child);
    this.bodyChildren.push(child);
    return child;
  }

  private showWeek(): void {
    const body = this.resetBody();
    if (!body) return;

    const { data } = this.context.plugin;
    const week = data.weekState();
    const streaks = data.streaks();

    this.mount(new WeekSummary(body, week, streaks));

    const suggestion = suggestNext(week);
    for (const slot of orderSlots(week)) {
      this.mount(
        new SlotCard(body, {
          slot,
          template: findTemplate(slot.templateId, data.templates),
          nudge: suggestion?.slot === slot ? suggestion.nudge : null,
          onOpen: (templateId) => this.showSheet(templateId),
        }),
      );
    }

    this.mount(
      new BonusCard(body, {
        unlocked: week.bonusUnlocked,
        templates: bonusTemplatesFor(data.plan, data.templates),
        existing: week.bonusSessions,
        onOpen: (templateId) => this.showSheet(templateId),
      }),
    );

    this.mount(
      new OtherCard(body, {
        existing: week.otherSessions,
        onOpen: () => this.showActivitySheet(),
      }),
    );
  }

  private showActivitySheet(): void {
    const body = this.resetBody();
    if (!body) return;

    this.mount(
      new ActivitySheet(body, {
        title: "A different workout",
        activities: DEFAULT_ACTIVITIES,
        commitText: "Log it",
        onBack: () => this.showWeek(),
        onCommit: (activity, note) => this.commitActivity(activity, note),
      }),
    );
  }

  private commitActivity(activity: string, note: string): Promise<void> {
    return this.commit(OTHER_TEMPLATE_ID, {}, note, activity);
  }

  private showSheet(templateId: string): void {
    const body = this.resetBody();
    if (!body) return;

    const template = findTemplate(templateId, this.context.plugin.data.templates);
    if (!template) {
      this.showWeek();
      return;
    }

    // A cardio slot has no muscle groups, so steppers would be an empty list.
    // It picks an activity instead, and still fills its required slot.
    if (template.kind === "cardio") {
      this.mount(
        new ActivitySheet(body, {
          title: template.name,
          activities: CARDIO_ACTIVITIES,
          commitText: "Log it",
          onBack: () => this.showWeek(),
          onCommit: (activity, note) =>
            this.commit(templateId, {}, note, activity),
        }),
      );
      return;
    }

    this.mount(
      new SessionSheet(body, {
        template,
        onBack: () => this.showWeek(),
        onCommit: (sets, note) => this.commit(templateId, sets, note),
      }),
    );
  }

  private async commit(
    templateId: string,
    sets: Record<MuscleGroup, number>,
    note: string,
    activity?: string,
  ): Promise<void> {
    const { data } = this.context.plugin;

    // Streak before the write, so an extension can be detected after it.
    const streakBefore = data.streaks().current;

    let record: SessionRecord;
    try {
      record = await data.commit({ templateId, sets, note, activity });
    } catch (error) {
      this.context.plugin.reportError(error);
      this.showWeek();
      return;
    }

    const week = data.weekState();
    const streaks = data.streaks();

    this.showWeek();
    this.celebrate(week, streaks, streakBefore);
    this.offerUndo(record);
  }

  private celebrate(
    week: WeekState,
    streaks: StreakState,
    streakBefore: number,
  ): void {
    // Milestone scaling (spec §4.3): the third slot of the week and a streak
    // extension each get their own variant.
    let tier: CelebrationTier = "session";
    let detail: string | undefined;

    if (streaks.current > streakBefore && streaks.current > 1) {
      tier = "streak";
      detail = `${streaks.current} weeks running.`;
    } else if (week.complete) {
      tier = "week";
    }

    const { plugin } = this.context;
    const imageUrl =
      plugin.settings.celebrationMode === "folder"
        ? pickCelebrationImage(plugin.app, plugin.settings.celebrationFolder)
        : null;

    this.mount(
      new Celebration(this.context.viewEl, { tier, detail, imageUrl }),
    );
  }

  private offerUndo(record: SessionRecord): void {
    const { plugin } = this.context;

    this.mount(
      new UndoToast(this.context.viewEl, {
        message: record.activity
          ? `Logged ${record.activity}.`
          : `Logged ${record.totalSets} sets.`,
        onUndo: async () => {
          try {
            await plugin.data.undo(record);
          } catch (error) {
            plugin.reportError(error);
          }
          this.showWeek();
        },
      }),
    );
  }

  onunload(): void {
    this.bodyChildren = [];
    this.bodyEl = null;
    super.onunload();
  }
}

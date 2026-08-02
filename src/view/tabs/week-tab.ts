import { Component, type App } from "obsidian";
import { TAB_LABELS, TabId } from "../../constants";
import {
  formatShortDate,
  isSameDate,
  today,
  type CivilDate,
  type WeekDay,
} from "../../data/dates";
import { bonusTemplatesFor, loggableTemplates } from "../../data/plans";
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
import { PreviousCard } from "../week/previous-card";
import { SessionSheet } from "../week/session-sheet";
import { SlotCard } from "../week/slot-card";
import { WeekSummary } from "../week/week-summary";
import { WorkoutPicker } from "../week/workout-picker";
import { DatePickerModal } from "../../ui/date-picker-modal";
import { MotivationModal } from "../../ui/motivation-modal";
import { DomsTab, type TabContext } from "./doms-tab";

export class WeekTab extends DomsTab {
  readonly id: TabId = "week";
  readonly heading = TAB_LABELS.week;
  readonly asciiKey: AsciiKey = "WEEK";

  private bodyEl: HTMLElement | null = null;
  /** Children of the body only, so a re-render does not tear down the banner. */
  private bodyChildren: Component[] = [];
  /** Lives in the banner, so the body cannot rebuild it. Hidden on sheets. */
  private motivateEl: HTMLElement | null = null;

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
    this.motivateEl = button;
    this.registerDomEvent(button, "click", () => {
      new MotivationModal(context.plugin).open();
    });
  }

  /**
   * The banner survives a body swap, so the nudge would otherwise follow you
   * into the logging sheet. Motivation belongs on the week you are looking at,
   * not on the workout you have already turned up for.
   */
  private showMotivate(visible: boolean): void {
    this.motivateEl?.toggleClass("is-hidden", !visible);
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
    this.showMotivate(true);

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

    // Last on the page: a correction affordance, not a way to log today.
    this.mount(
      new PreviousCard(body, { onOpen: () => this.pickPreviousDate() }),
    );
  }

  /**
   * Step one of logging a previous workout: which day was it?
   *
   * The date comes first because it is what the user actually remembers — "I
   * forgot to log Thursday" — and because it decides which week the session
   * lands in, which is the whole point of the flow.
   */
  private pickPreviousDate(): void {
    const { plugin } = this.context;

    new DatePickerModal(plugin.app, {
      selected: today(),
      weekStart: plugin.settings.weekStart,
      onPick: (date) => this.showWorkoutPicker(date),
    }).open();
  }

  /** Step two: which workout was it? */
  private showWorkoutPicker(date: CivilDate): void {
    const body = this.resetBody();
    if (!body) return;
    this.showMotivate(false);

    const { data } = this.context.plugin;

    this.mount(
      new WorkoutPicker(body, {
        templates: loggableTemplates(data.plan, data.templates),
        app: this.context.plugin.app,
        weekStart: this.context.plugin.settings.weekStart,
        date,
        onBack: () => this.showWeek(),
        onPick: (templateId, picked) => this.showSheet(templateId, picked),
      }),
    );
  }

  private showActivitySheet(date?: CivilDate): void {
    const body = this.resetBody();
    if (!body) return;
    this.showMotivate(false);

    this.mount(
      new ActivitySheet(body, {
        title: "A different workout",
        activities: DEFAULT_ACTIVITIES,
        commitText: "Log it",
        date,
        ...this.sheetChrome(),
        onCommit: (activity, note, when) =>
          this.commit(OTHER_TEMPLATE_ID, {}, note, when, activity),
      }),
    );
  }

  /** What every sheet needs to draw its header and open the date picker. */
  private sheetChrome(): { app: App; weekStart: WeekDay; onBack: () => void } {
    const { plugin } = this.context;
    return {
      app: plugin.app,
      weekStart: plugin.settings.weekStart,
      onBack: () => this.showWeek(),
    };
  }

  private showSheet(templateId: string, date?: CivilDate): void {
    const body = this.resetBody();
    if (!body) return;
    this.showMotivate(false);

    const template = findTemplate(templateId, this.context.plugin.data.templates);
    if (!template) {
      this.showWeek();
      return;
    }

    // "A different workout" has its own sheet whichever route reaches it.
    if (template.kind === "other") {
      this.showActivitySheet(date);
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
          date,
          ...this.sheetChrome(),
          onCommit: (activity, note, when) =>
            this.commit(templateId, {}, note, when, activity),
        }),
      );
      return;
    }

    this.mount(
      new SessionSheet(body, {
        template,
        date,
        ...this.sheetChrome(),
        onCommit: (sets, note, when) =>
          this.commit(templateId, sets, note, when),
      }),
    );
  }

  private async commit(
    templateId: string,
    sets: Record<MuscleGroup, number>,
    note: string,
    date: CivilDate,
    activity?: string,
  ): Promise<void> {
    const { data } = this.context.plugin;

    // Streak before the write, so an extension can be detected after it.
    const streakBefore = data.streaks().current;

    let record: SessionRecord;
    try {
      record = await data.commit({ templateId, sets, note, date, activity });
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

    const what = record.activity ?? `${record.totalSets} sets`;
    // A backdated session may land in a week the view is not showing, so the
    // toast is the only place that can say where it went.
    const when = isSameDate(record.date, today())
      ? ""
      : ` on ${formatShortDate(record.date)}`;

    this.mount(
      new UndoToast(this.context.viewEl, {
        message: `Logged ${what}${when}.`,
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
    this.motivateEl = null;
    super.onunload();
  }
}

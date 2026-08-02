import { deriveWeekState, computeStreaks } from "../src/data/week-state";
import { DEFAULT_TEMPLATES, REHAB_AREAS } from "../src/data/templates";
import {
  LATS_LOWER_BACK, MUSCLE_GROUPS, UPPER_BACK, findMuscle, isTracked,
  migrateSets, muscleSections, splitLegacyBack, trackedMuscles,
} from "../src/data/muscles";
import { PLANS, findPlan, bonusTemplatesFor, slotCount, loggableTemplates } from "../src/data/plans";
import { parseIsoDate, weekKeyFor, formatIsoDate, addDays, BACKDATE_LIMIT_DAYS, earliestLoggableDate } from "../src/data/dates";
import type { SessionRecord } from "../src/data/types";

const OPTS = { weekStart: 1 as const, templates: DEFAULT_TEMPLATES, plan: findPlan("three-day") };
const PPL = { ...OPTS, plan: findPlan("ppl") };
const UL = { ...OPTS, plan: findPlan("upper-lower") };
let fails = 0;
function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${JSON.stringify(got)}${ok ? "" : ` (want ${JSON.stringify(want)})`}`);
}

let n = 0;
function s(iso: string, templateId: string): SessionRecord {
  const date = parseIsoDate(iso)!;
  const tpl = DEFAULT_TEMPLATES.find((t) => t.id === templateId)!;
  const total = Object.values(tpl.sets).reduce((a, b) => a + b, 0);
  return {
    file: { path: `DOMS/log/${iso}-${++n}.md` } as any,
    date, dateIso: iso,
    weekKey: weekKeyFor(date, 1),
    templateId, slot: "required",
    sets: { ...tpl.sets }, totalSets: total, activity: null, planId: null,
  };
}

function other(iso: string, activity: string): SessionRecord {
  const date = parseIsoDate(iso)!;
  return {
    file: { path: `DOMS/log/${iso}-o${++n}.md` } as any,
    date, dateIso: iso,
    weekKey: weekKeyFor(date, 1),
    templateId: "other", planId: null, slot: "other",
    sets: {}, totalSets: 0, activity,
  };
}

// --- canonical body part list ---------------------------------------------
console.log("== canonical muscle group list ==");
{
  const ids = MUSCLE_GROUPS.map((m) => m.id);
  check("no duplicate ids", ids.length, new Set(ids).size);
  check("tracked count", trackedMuscles().length, 11);
  check("forearms present", findMuscle("forearms")?.tracked, true);
  check("back is gone", findMuscle("back"), null);
  check("both back groups tracked", [
    findMuscle(UPPER_BACK)?.tracked,
    findMuscle(LATS_LOWER_BACK)?.tracked,
  ], [true, true]);
  check("core is untracked", findMuscle("core")?.tracked, false);
  check("rehab work is untracked", findMuscle("rotator cuff")?.tracked, false);
  check("unknown ids are untracked", isTracked("nonsense"), false);

  // Every set count any template declares has to name a real body part, or the
  // sheet would render a row nothing else in the app knows about.
  const unknown: string[] = [];
  for (const t of DEFAULT_TEMPLATES) {
    for (const m of Object.keys(t.sets)) if (!findMuscle(m)) unknown.push(`${t.id}/${m}`);
  }
  check("every template key is on the list", unknown, []);

  // The picker offers everything, minus what is already on the sheet.
  const sections = muscleSections(new Set(["chest", "quads"]));
  const offered = sections.flatMap((g) => g.muscles.map((m) => m.id));
  check("picker excludes what is present", offered.includes("chest"), false);
  check("picker offers the rest", offered.length, MUSCLE_GROUPS.length - 2);
  check("picker leads with push", sections[0].section, "push");
  check("picker ends with rehab", sections[sections.length - 1].section, "rehab");
}

console.log("\n== legacy `back` migration ==");
{
  check("even split", splitLegacyBack(10), { [UPPER_BACK]: 5, [LATS_LOWER_BACK]: 5 });
  // Odd set goes to upper back.
  check("odd split", splitLegacyBack(7), { [UPPER_BACK]: 4, [LATS_LOWER_BACK]: 3 });
  check("one set", splitLegacyBack(1), { [UPPER_BACK]: 1, [LATS_LOWER_BACK]: 0 });

  // The guarantee that matters: historical totals must not move.
  for (const n of [1, 2, 3, 6, 7, 10, 13]) {
    const split = splitLegacyBack(n);
    check(`  total preserved for ${n}`, split[UPPER_BACK] + split[LATS_LOWER_BACK], n);
  }

  const migrated = migrateSets({ chest: 4, back: 7, biceps: 2 });
  check("back key removed", migrated.back, undefined);
  check("other groups untouched", [migrated.chest, migrated.biceps], [4, 2]);
  check("split applied", [migrated[UPPER_BACK], migrated[LATS_LOWER_BACK]], [4, 3]);
  check(
    "session total preserved",
    Object.values(migrated).reduce((a, b) => a + b, 0),
    13,
  );

  // A note already using the new keys is left exactly as it is.
  const already = { [UPPER_BACK]: 3, [LATS_LOWER_BACK]: 3 };
  check("no legacy key is a no-op", migrateSets(already), already);
  // And one carrying both ends up with the sum rather than losing either.
  const both = migrateSets({ back: 4, [UPPER_BACK]: 1 });
  check("mixed keys add up", [both[UPPER_BACK], both[LATS_LOWER_BACK]], [3, 2]);
}

// --- week state -----------------------------------------------------------
console.log("\n== week state, mid week, 1 of 3 done ==");
{
  const sessions = [s("2026-07-27", "upper")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-29")!, OPTS);
  check("weekKey", w.weekKey, "2026-W31");
  check("range", [w.startIso, w.endIso], ["2026-07-27", "2026-08-02"]);
  check("daysLeft", w.daysLeft, 5);
  check("requiredDone", w.requiredDone, 1);
  check("slotsDone", w.slots.map((x) => x.done), [true, false, false]);
  check("bonusUnlocked", w.bonusUnlocked, false);
  check("complete", w.complete, false);
  check("chest volume", w.volume.chest, 4);
  check("totalSets", w.totalSets, 16);
}

console.log("\n== same slot twice: second spills to bonus, slot stays open ==");
{
  const sessions = [s("2026-07-27", "upper"), s("2026-07-29", "upper")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-29")!, OPTS);
  check("requiredDone", w.requiredDone, 1);
  check("upper slot done", w.slots[0].done, true);
  check("lower still open", w.slots[1].done, false);
  check("bonus count", w.bonusSessions.length, 1);
  check("bonusUnlocked (still hidden)", w.bonusUnlocked, false);
  check("chest volume doubled", w.volume.chest, 8);
}

console.log("\n== full week + a bonus session ==");
{
  const sessions = [
    s("2026-07-27", "upper"), s("2026-07-29", "lower"),
    s("2026-07-31", "full"), s("2026-08-01", "push"),
  ];
  const w = deriveWeekState(sessions, parseIsoDate("2026-08-02")!, OPTS);
  check("complete", w.complete, true);
  check("bonusUnlocked", w.bonusUnlocked, true);
  check("bonus count", w.bonusSessions.length, 1);
  check("daysLeft on last day", w.daysLeft, 1);
  // spec §3: three required sessions deliver chest 7, back 7, quads 8 ...
  check("chest (3 required + push 6)", w.volume.chest, 13);
  // Back is two groups now. The sum is what has to stay put.
  check("back total", w.volume["upper back"] + w.volume["lats and lower back"], 7);
  check("quads", w.volume.quads, 8);
}

console.log("\n== spec §3 derived volume from a perfect required week ==");
{
  const sessions = [s("2026-07-27","upper"), s("2026-07-29","lower"), s("2026-07-31","full")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-31")!, OPTS);
  const want = {
    chest:7, "upper back":4, "lats and lower back":3, shoulders:5,
    quads:8, hamstrings:6, glutes:6, calves:3, core:3, biceps:2, triceps:2,
  };
  for (const [m, v] of Object.entries(want)) check(`  ${m}`, w.volume[m], v);
  // The split must not change what a perfect week delivers in total.
  check("  week total unchanged", w.totalSets, 49);
}

// --- streaks --------------------------------------------------------------
console.log("\n== a different workout never fills a slot ==");
{
  const sessions = [s("2026-07-27", "upper"), other("2026-07-28", "Bike ride"), other("2026-07-29", "Pickleball")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-29")!, OPTS);
  check("still 1 of 3", w.requiredDone, 1);
  check("not complete", w.complete, false);
  check("bonus stays empty", w.bonusSessions.length, 0);
  check("other sessions collected", w.otherSessions.length, 2);
  check("bonus still locked", w.bonusUnlocked, false);
  check("volume untouched by activity", w.totalSets, 16);
}
{
  // a full week plus activity: activity must not inflate anything
  const sessions = [s("2026-07-27","upper"), s("2026-07-28","lower"), s("2026-07-29","full"), other("2026-07-30","Hike")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-31")!, OPTS);
  check("3 of 3", w.requiredDone, 3);
  check("complete", w.complete, true);
  check("other listed separately", w.otherSessions.length, 1);
  check("totalSets excludes the hike", w.totalSets, 49);
}

console.log("\n== rehab is a bonus option ==");
{
  const bonus = bonusTemplatesFor(findPlan("three-day"), DEFAULT_TEMPLATES).map((t) => t.id);
  check("bonus ids on the three day plan", bonus, ["push", "pull", "legs", "rehab"]);
  check("other is its own kind", DEFAULT_TEMPLATES.find((t) => t.id === "other")!.kind, "other");
  check("other has no sets", Object.keys(DEFAULT_TEMPLATES.find((t) => t.id === "other")!.sets).length, 0);
  check("rehab does not affect required volume", deriveVolumeTargets(findPlan("three-day"), DEFAULT_TEMPLATES).find((t) => t.muscle === "chest")!.target, 7);
}

console.log("\n== streaks ==");
function week(mondayIso: string) {
  const d = parseIsoDate(mondayIso)!;
  // addDays, not d.day + off: 2026-07-27 + 5 is August, not "2026-07-32".
  const iso = (off: number) => formatIsoDate(addDays(d, off));
  return [s(mondayIso, "upper"), s(iso(1), "lower"), s(iso(2), "full")];
}
{
  // three complete weeks running up to and including the current one
  const sessions = [...week("2026-07-13"), ...week("2026-07-20"), ...week("2026-07-27")];
  const st = computeStreaks(sessions, OPTS, parseIsoDate("2026-07-29")!);
  check("current (this week already done)", st.current, 3);
  check("best", st.best, 3);
}
{
  // current week only partly done — must NOT break the streak
  const sessions = [...week("2026-07-13"), ...week("2026-07-20"), s("2026-07-27", "upper")];
  const st = computeStreaks(sessions, OPTS, parseIsoDate("2026-07-29")!);
  check("current (in progress, not broken)", st.current, 2);
  check("best", st.best, 2);
}
{
  // a missed week resets current, best survives
  const sessions = [...week("2026-06-01"), ...week("2026-06-08"), ...week("2026-06-15"), ...week("2026-07-20")];
  const st = computeStreaks(sessions, OPTS, parseIsoDate("2026-07-29")!);
  check("current (last week done, this week empty)", st.current, 1);
  check("best (the old run of 3)", st.best, 3);
}
{
  check("no sessions", computeStreaks([], OPTS, parseIsoDate("2026-07-29")!), { current: 0, best: 0 });
}


// Run with: npm run check

// --- volume bands ---------------------------------------------------------
import { deriveVolumeTargets, trackedTargets } from "../src/data/volume";
console.log("\n== derived volume targets (spec §3) ==");
{
  const targets = deriveVolumeTargets(findPlan("three-day"), DEFAULT_TEMPLATES);
  const by = Object.fromEntries(targets.map((t) => [t.muscle, t]));
  check("quads target", by.quads.target, 8);
  check("biceps target", by.biceps.target, 2);
  check("back split targets", [by[UPPER_BACK].target, by[LATS_LOWER_BACK].target], [4, 3]);
  check("canonical order, push first", targets[0].muscle, "chest");

  // Untracked groups are still derived; they just carry no goal downstream.
  check("core is derived", by.core.target, 3);
  check("core is not a tracked target", trackedTargets(findPlan("three-day"), DEFAULT_TEMPLATES).some((t) => t.muscle === "core"), false);

  // PPL is the plan the targets were sized for.
  const ppl = trackedTargets(findPlan("ppl"), DEFAULT_TEMPLATES);
  check("ppl covers 11 tracked groups", ppl.length, 11);
  check("ppl every group on 12", ppl.every((t) => t.target === 12), true);

  // A zero-set offer on the rehab sheet is not an ask.
  const rehabOnly = deriveVolumeTargets(
    { id: "x", name: "x", description: "", slots: ["rehab"] },
    DEFAULT_TEMPLATES,
  );
  check("zero-set offers excluded", rehabOnly.some((t) => t.muscle === "feet"), false);
  check("non-zero rehab areas included", rehabOnly.find((t) => t.muscle === "rotator cuff")?.target, 3);
}


// --- suggestion / time pressure -------------------------------------------
import { suggestNext, orderSlots, shouldNudgeFullBody } from "../src/data/suggest";
console.log("\n== suggested next slot and full body nudge ==");
{
  // Monday, nothing done: plain next up, no nudge
  const w = deriveWeekState([], parseIsoDate("2026-07-27")!, OPTS);
  check("no nudge early in week", shouldNudgeFullBody(w), false);
  check("suggests first open slot", suggestNext(w)!.slot.templateId, "upper");
  check("nudge copy absent", suggestNext(w)!.nudge, null);
}
{
  // Thursday (4 left), 0 done -> more than half over, under two slots
  const w = deriveWeekState([], parseIsoDate("2026-07-30")!, OPTS);
  check("daysLeft Thu", w.daysLeft, 4);
  check("no nudge with 4 left", shouldNudgeFullBody(w), false);
}
{
  // Friday (3 left), 0 done -> nudge full body
  const w = deriveWeekState([], parseIsoDate("2026-07-31")!, OPTS);
  check("daysLeft Fri", w.daysLeft, 3);
  check("nudges full body", shouldNudgeFullBody(w), true);
  check("suggests full", suggestNext(w)!.slot.templateId, "full");
  check("nudge copy", suggestNext(w)!.nudge, "Short on time? Do this one.");
  check("full body ordered first", orderSlots(w)[0].templateId, "full");
}
{
  // Friday but two already done -> no nudge, not under pressure
  const sessions = [s("2026-07-27", "upper"), s("2026-07-29", "lower")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-31")!, OPTS);
  check("no nudge with 2 done", shouldNudgeFullBody(w), false);
  check("suggests remaining slot", suggestNext(w)!.slot.templateId, "full");
}
{
  // Friday, full body already done -> nudge cannot apply
  const sessions = [s("2026-07-27", "full")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-31")!, OPTS);
  check("no nudge when full body done", shouldNudgeFullBody(w), false);
}
{
  // all done -> nothing to suggest
  const sessions = [s("2026-07-27","upper"), s("2026-07-28","lower"), s("2026-07-29","full")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-31")!, OPTS);
  check("nothing suggested", suggestNext(w), null);
  check("order keeps all three", orderSlots(w).length, 3);
}
{
  // completed slots sort after open ones
  const sessions = [s("2026-07-27", "upper")];
  const w = deriveWeekState(sessions, parseIsoDate("2026-07-28")!, OPTS);
  check("done slot last", orderSlots(w).map((x) => x.done), [false, false, true]);
}


// --- stats -----------------------------------------------------------------
import { summarize, buildMonth, intensityLevel, weeklySets, cumulativeVolume } from "../src/data/stats";
import { shiftMonth } from "../src/data/dates";
const NOW = parseIsoDate("2026-07-29")!;
console.log("\n== stats summary ==");
{
  const sessions = [...week("2026-07-13"), ...week("2026-07-20"), s("2026-07-27", "upper")];
  const st = summarize(sessions, OPTS, NOW);
  check("totalSessions", st.totalSessions, 7);
  // a full week is upper 16 + lower 16 + full 17 = 49
  check("totalSets", st.totalSets, 49 * 2 + 16);
  check("currentStreak", st.currentStreak, 2);
  check("bestStreak", st.bestStreak, 2);
  check("empty summary", summarize([], OPTS, NOW), { totalSessions: 0, totalSets: 0, currentStreak: 0, bestStreak: 0 });
}

console.log("\n== month calendar ==");
{
  const sessions = [s("2026-07-27", "upper"), s("2026-07-27", "lower"), s("2026-07-29", "full"), other("2026-07-15", "Hike")];
  const m = buildMonth(sessions, 2026, 7, OPTS);
  check("label", m.label, "July 2026");
  check("weekday order (Mon start)", m.weekdays, ["Mo","Tu","We","Th","Fr","Sa","Su"]);
  // 1 Jul 2026 is a Wednesday -> two leading blanks in a Monday-start week
  check("leading blanks", m.cells.slice(0, 3).map((c) => c === null), [true, true, false]);
  check("first real cell is the 1st", m.cells[2]!.date.day, 1);
  check("cells pad to whole weeks", m.cells.length % 7, 0);
  check("31 real days", m.cells.filter((c) => c !== null).length, 31);
  check("sessionCount", m.sessionCount, 4);
  check("totalSets", m.totalSets, 16 + 16 + 17);

  const byDay = Object.fromEntries(m.cells.filter(Boolean).map((c) => [c!.date.day, c!]));
  check("27th stacks two sessions", byDay[27].sets, 32);
  check("27th level maxes out", byDay[27].level, 4);
  check("29th level", byDay[29].level, 3);
  check("empty day level 0", byDay[28].level, 0);
  // a hike logs no sets but must still register as activity
  check("15th has a session with 0 sets", byDay[15].sets, 0);
  check("15th still shows as active", byDay[15].level, 1);
}

console.log("\n== month navigation wraps years ==");
{
  check("Jan -> back", shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
  check("Dec -> forward", shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  check("no-op", shiftMonth(2026, 7, 0), { year: 2026, month: 7 });
  check("back 13", shiftMonth(2026, 7, -13), { year: 2025, month: 6 });
}

{
  // February leap year
  const feb = buildMonth([], 2028, 2, OPTS);
  check("Feb 2028 has 29 days", feb.cells.filter((c) => c !== null).length, 29);
  const feb27 = buildMonth([], 2027, 2, OPTS);
  check("Feb 2027 has 28 days", feb27.cells.filter((c) => c !== null).length, 28);
}

console.log("\n== intensity buckets ==");
{
  check("0", intensityLevel(0), 0);
  check("1", intensityLevel(1), 1);
  check("6", intensityLevel(6), 1);
  check("7", intensityLevel(7), 2);
  check("16 (a normal session)", intensityLevel(16), 3);
  check("19", intensityLevel(19), 4);
}

console.log("\n== this week's sets ==");
{
  const empty = weeklySets([], OPTS, NOW);
  check("no sessions -> every tracked group at zero", empty.tracked.every((r) => r.done === 0), true);
  check("tracked rows still render", empty.tracked.length, 10);
  check("nothing extra", empty.extra, []);
}
{
  // A perfect three-day week fills every bar exactly.
  const w = weeklySets(week("2026-07-27"), OPTS, NOW);
  const by = Object.fromEntries(w.tracked.map((r) => [r.muscle, r]));
  check("quads 8/8", [by.quads.done, by.quads.target], [8, 8]);
  check("biceps 2/2", [by.biceps.done, by.biceps.target], [2, 2]);
  check("upper back 4/4", [by[UPPER_BACK].done, by[UPPER_BACK].target], [4, 4]);
  check("every bar full", w.tracked.every((r) => r.done === r.target), true);
  // Core is logged but untracked, so it is a count, not a bar.
  check("core is not a bar", w.tracked.some((r) => r.muscle === "core"), false);
  check("core is an extra", w.extra.find((r) => r.muscle === "core")?.sets, 3);
  check("extras carry a label", w.extra[0].label, "Core");
}
{
  // Partial progress is the whole point: one upper day into the week.
  const w = weeklySets([s("2026-07-27", "upper")], OPTS, NOW);
  const by = Object.fromEntries(w.tracked.map((r) => [r.muscle, r]));
  check("chest 4/7 partial", [by.chest.done, by.chest.target], [4, 7]);
  check("quads 0/8 untouched", [by.quads.done, by.quads.target], [0, 8]);
}
{
  // Last week's sessions do not bleed into this week's readout.
  const w = weeklySets(week("2026-07-20"), OPTS, NOW);
  check("previous week excluded", w.tracked.every((r) => r.done === 0), true);
}
{
  // A tracked group logged on a plan that never programs it has no target, so
  // it lands in the counts rather than inventing a denominator.
  const forearms: SessionRecord = { ...s("2026-07-27", "upper"), sets: { forearms: 4 }, totalSets: 4 };
  const w = weeklySets([forearms], OPTS, NOW);
  check("forearms has no bar on three-day", w.tracked.some((r) => r.muscle === "forearms"), false);
  check("forearms counted as extra", w.extra.find((r) => r.muscle === "forearms")?.sets, 4);
  // On PPL it is programmed, so it becomes a bar.
  const ppl = weeklySets([forearms], PPL, NOW);
  check("forearms is a bar on ppl", ppl.tracked.find((r) => r.muscle === "forearms")?.target, 12);
}

console.log("\n== logging a previous workout ==");
{
  // The picker offers the plan's own sessions first, then everything else,
  // with repeats collapsed.
  const three = loggableTemplates(findPlan("three-day"), DEFAULT_TEMPLATES);
  check("plan sessions lead", three.slice(0, 3).map((t) => t.id), ["upper", "lower", "full"]);
  check("everything is offered", three.length, DEFAULT_TEMPLATES.length);
  check("no duplicates", three.length, new Set(three.map((t) => t.id)).size);

  const ppl = loggableTemplates(findPlan("ppl"), DEFAULT_TEMPLATES);
  check("ppl repeats collapse", ppl.slice(0, 4).map((t) => t.id), ["push", "pull", "legs", "cardio"]);
  check("ppl offers everything once", ppl.length, DEFAULT_TEMPLATES.length);
  check("a different workout is reachable", ppl.some((t) => t.id === "other"), true);
}
{
  // Decision 4: thirty days back, and no further.
  const from = parseIsoDate("2026-08-02")!;
  check("backdate limit", BACKDATE_LIMIT_DAYS, 30);
  check("earliest loggable", formatIsoDate(earliestLoggableDate(from)), "2026-07-03");
}
{
  // Decision 5: a backdated session counts fully in the week it lands in.
  // Last week is missing its full body day; logging it now completes that week.
  const sessions = [
    s("2026-07-20", "upper"), s("2026-07-22", "lower"),
    ...week("2026-07-27"),
  ];
  const before = deriveWeekState(sessions, parseIsoDate("2026-07-24")!, OPTS);
  check("last week incomplete before", before.complete, false);
  check("streak counts this week only", computeStreaks(sessions, OPTS, NOW).current, 1);

  const backdated = [...sessions, s("2026-07-24", "full")];
  const after = deriveWeekState(backdated, parseIsoDate("2026-07-24")!, OPTS);
  check("backdated session completes that week", after.complete, true);
  check("it fills the slot, not the bonus", after.bonusSessions.length, 0);
  // Two complete weeks back to back, so the streak follows.
  check("streak extends to 2", computeStreaks(backdated, OPTS, NOW).current, 2);
  // And it does not touch the current week's readout.
  check("this week's sets unaffected", weeklySets(backdated, OPTS, NOW).tracked.every((r) => r.done === r.target), true);
}

console.log("\n== cumulative volume ==");
{
  const sessions = [...week("2026-07-20"), s("2026-07-27", "push")];
  const totals = cumulativeVolume(sessions);
  const by = Object.fromEntries(totals.map((t) => [t.muscle, t.sets]));
  check("chest 7 + push 6", by.chest, 13);
  check("calves", by.calves, 3);
  check("sorted desc", totals[0].sets >= totals[1].sets, true);
  check("empty", cumulativeVolume([]), []);
}


// --- content -------------------------------------------------------------
import { safeUrl, toLabel, videoUrl, groupNotes, groupRank } from "../src/data/content";
import { STARTER_CONTENT, renderNote } from "../src/data/seed-content";
import { SEED_IDEAS } from "../src/data/seed-ideas";
import { SEED_REHAB } from "../src/data/seed-rehab";
import { VIDEO_IDS, video } from "../src/data/content-videos";
import { ASSIGNMENT_KEYS } from "../src/data/seed-videos";

console.log("\n== url sanitisation ==");
{
  check("https ok", safeUrl("https://example.com/a"), "https://example.com/a");
  check("javascript rejected", safeUrl("javascript:alert(1)"), null);
  check("data rejected", safeUrl("data:text/html,<script>"), null);
  check("file rejected", safeUrl("file:///etc/passwd"), null);
  check("non-string rejected", safeUrl(42), null);
  check("garbage rejected", safeUrl("not a url"), null);
}

console.log("\n== video ids ==");
{
  check("url built from bare id", videoUrl("fGm-ef-4PVk"), "https://www.youtube.com/watch?v=fGm-ef-4PVk");
  check("every id is 11 chars", VIDEO_IDS.every((id) => id.length === 11), true);
  check("every id is url safe", VIDEO_IDS.every((id) => /^[A-Za-z0-9_-]{11}$/.test(id)), true);
  check("lookup returns source", video("fGm-ef-4PVk").source, "Jeff Nippard");
  let threw = false;
  try { video("notarealid"); } catch { threw = true; }
  check("unknown id throws at build time", threw, true);
}

console.log("\n== labels and grouping ==");
{
  check("hyphenated", toLabel("upper-back"), "Upper back");
  check("push before pull", groupRank("push") < groupRank("pull"), true);
  check("other sorts last", groupRank("other") > groupRank("core"), true);
  check("unknown group sorts after known", groupRank("zzz") >= groupRank("other"), true);
}

console.log("\n== starter content integrity ==");
{
  check("ideas categories", SEED_IDEAS.length, 20);
  check("rehab categories", SEED_REHAB.length, 16);

  const slugs = STARTER_CONTENT.map((n) => `${n.category}/${n.slug}`);
  check("no duplicate files", new Set(slugs).size, slugs.length);

  const entries = STARTER_CONTENT.flatMap((n) => n.exercises);
  check("over 150 exercises", entries.length > 150, true);
  check("every exercise has a name", entries.every((e) => e.name.trim().length > 0), true);
  check("every exercise has a note", entries.every((e) => e.note.trim().length > 0), true);

  // the whole point of this pass: videos are the only links
  const json = JSON.stringify(STARTER_CONTENT);
  check("no http links anywhere in the seed", /https?:\/\//.test(json), false);

  const used = [...STARTER_CONTENT.flatMap((n) => n.videos ?? []),
                ...entries.flatMap((e) => e.videos ?? [])];
  check("videos are used", used.length > 30, true);
  check("every video id is verified", used.every((v) => VIDEO_IDS.includes(v.id)), true);
  check("every video has a source", used.every((v) => v.source.trim().length > 0), true);
  check("no title is a playlist name", used.every((v) => v.title !== "Technique Tuesday"), true);
  check("vcBig73ojpE titled correctly", video("vcBig73ojpE").title.includes("Bench Press"), true);

  const parts = SEED_REHAB.map((n) => n.slug);
  for (const required of ["knees", "ankles", "hips", "lower-back", "rotator-cuff", "neck", "wrists", "elbows"]) {
    check(`  rehab covers ${required}`, parts.includes(required), true);
  }
  check("neck carries a caution", SEED_REHAB.find((n) => n.slug === "neck")!.caution !== undefined, true);
  check("every rehab category has 6+ exercises", SEED_REHAB.every((n) => n.exercises.length >= 6), true);

  // Every rehab template area should have a matching content note to read.
  const rehabSlugs = new Set(SEED_REHAB.map((n) => n.slug));
  const areaToSlug = (a: string) => a.replace(/ /g, "-");
  for (const area of REHAB_AREAS) {
    check(`  area "${area}" has content`, rehabSlugs.has(areaToSlug(area)), true);
  }

  const groups = new Set(SEED_IDEAS.map((n) => n.group));
  for (const g of ["push", "pull", "legs", "core", "other"]) {
    check(`  ideas has group ${g}`, groups.has(g), true);
  }
}

console.log("\n== generated note ==");
{
  const text = renderNote(SEED_IDEAS.find((n) => n.slug === "chest")!);
  check("starts with frontmatter", text.startsWith("---\n"), true);
  check("declares content marker", text.includes("doms: content"), true);
  check("has exercises key", text.includes("exercises:"), true);
  check("video id is bare, not a url", /id: [A-Za-z0-9_-]{11}$/m.test(text), true);
  check("no url in generated note", /https?:\/\//.test(text), false);

  // video titles contain colons; unquoted they would break the yaml
  const withColon = SEED_IDEAS.find((n) => (n.videos ?? []).some((v) => v.title.includes(":")));
  check("a colon-bearing title exists", withColon !== undefined, true);
  const colonText = renderNote(withColon!);
  check("titles are quoted", /  title: "/.test(colonText), true);

  check("caution is emitted", renderNote(SEED_REHAB.find((n) => n.slug === "neck")!).includes("caution:"), true);
}

console.log("\n== picker grouping ==");
{
  const fake = SEED_IDEAS.map((n, i) => ({
    file: { path: `x${i}.md` } as any,
    category: "ideas" as const,
    group: n.group, slug: n.slug, label: n.title,
    subtitle: n.subtitle, caution: n.caution ?? null,
    note: n.note ?? null, videos: [], exercises: [],
  }));
  const grouped = groupNotes(fake);
  check("five groups", grouped.length, 5);
  check("first group is push", grouped[0].group, "push");
  check("last group is other", grouped[grouped.length - 1].group, "other");
  check("all notes accounted for", grouped.reduce((n, g) => n + g.notes.length, 0), 20);
  check("group has a label", grouped[0].label, "Push");
}


// --- zero sets are not written -------------------------------------------
import { parseSets, sumValues } from "../src/data/session-store";
import { findTemplate } from "../src/data/templates";
console.log("\n== zero-set entries are dropped ==");
{
  const rehab = findTemplate("rehab", DEFAULT_TEMPLATES)!;
  check("template offers every area", Object.keys(rehab.sets).length, REHAB_AREAS.length);
  check("suggested total is modest", sumValues(rehab.sets), 10);

  const stored = parseSets(rehab.sets)!;
  check("only non-zero areas stored", Object.keys(stored).sort(), ["ankles", "hips", "neck", "rotator cuff"]);
  check("total unchanged", sumValues(stored), 10);

  // a user who zeroes out a main group should not log it either
  const upper = findTemplate("upper", DEFAULT_TEMPLATES)!;
  const edited = parseSets({ ...upper.sets, chest: 0, core: 0 })!;
  check("zeroed groups dropped", "chest" in edited || "core" in edited, false);
  check("remaining groups kept", sumValues(edited), sumValues(upper.sets) - 4 - 1);
  check("negatives rejected", parseSets({ chest: -3 })!, {});
  check("non-numeric rejected", parseSets({ chest: "abc" })!, {});
}


// --- every ideas video reaches the page ------------------------------------
console.log("\n== ideas videos are wired to the page ==");
{
  const ideas = STARTER_CONTENT.filter((n) => n.category === "ideas");
  const cat = ideas.flatMap((n) => (n.videos ?? []).map((v) => v.id));
  const ex = ideas.flatMap((n) => n.exercises.flatMap((e) => (e.videos ?? []).map((v) => v.id)));
  const all = new Set([...cat, ...ex]);
  check("more videos on the ideas page than before", all.size > 42, true);
  check("category level videos", cat.length > 0, true);
  check("exercise level videos", ex.length > 0, true);
  // Rehab used to have zero video coverage; Squat University fixed that.
  const rehabVids = STARTER_CONTENT.filter((n) => n.category === "rehab")
    .flatMap((n) => [...(n.videos ?? []), ...n.exercises.flatMap((e) => e.videos ?? [])]);
  check("rehab now has videos", rehabVids.length > 30, true);
  // Balance is the one area with no usable footage: the balance videos in the
  // sources are senior-falls content, which is the wrong framing here.
  const bare = STARTER_CONTENT.filter(
    (n) => n.category === "rehab" && (n.videos ?? []).length === 0,
  ).map((n) => n.slug);
  check("only balance lacks video coverage", bare, ["balance"]);

  // the round trip that actually matters: seed -> markdown -> what the reader sees
  for (const slug of ["chest", "quads", "glutes", "start-here"]) {
    const note = SEED_IDEAS.find((n) => n.slug === slug)!;
    const text = renderNote(note);
    const expected = [...(note.videos ?? []), ...note.exercises.flatMap((e) => e.videos ?? [])];
    const emitted = [...text.matchAll(/^\s*- id: ([A-Za-z0-9_-]{11})$/gm)].map((m) => m[1]);
    check(`  ${slug}: every video id survives rendering`, emitted.length, expected.length);
    check(`  ${slug}: ids match`, emitted.join(","), expected.map((v) => v.id).join(","));
    check(`  ${slug}: sources emitted`, (text.match(/source: /g) ?? []).length, expected.length);
  }
}


// --- legacy cleanup --------------------------------------------------------
import { LEGACY_SLUGS } from "../src/data/seed-content";
console.log("\n== superseded categories ==");
{
  const current = new Set(STARTER_CONTENT.map((n) => `${n.category}/${n.slug}`));

  // The safety property: cleanup must never target a slug still shipped.
  for (const category of ["ideas", "rehab"] as const) {
    for (const slug of LEGACY_SLUGS[category]) {
      check(`  ${category}/${slug} is not current`, current.has(`${category}/${slug}`), false);
    }
  }

  check("duplicates from image 11 are listed", ["arms", "back", "legs"].every((s) => LEGACY_SLUGS.ideas.includes(s)), true);
  check("merged-away ideas listed", ["abs", "deep-core"].every((s) => LEGACY_SLUGS.ideas.includes(s)), true);
  check("old singular rehab slugs listed", ["knee", "ankle", "hip", "wrist", "elbow", "shin", "low-back"].every((s) => LEGACY_SLUGS.rehab.includes(s)), true);

  // renamed pairs: the old one goes, the new one stays
  check("knee -> knees", LEGACY_SLUGS.rehab.includes("knee") && current.has("rehab/knees"), true);
  check("ankle -> ankles", LEGACY_SLUGS.rehab.includes("ankle") && current.has("rehab/ankles"), true);
  check("low-back -> lower-back", LEGACY_SLUGS.rehab.includes("low-back") && current.has("rehab/lower-back"), true);
  check("abs+deep-core -> core", current.has("ideas/core"), true);
  // rotator-cuff and neck survived the rename and must not be swept up
  check("rotator-cuff not swept", LEGACY_SLUGS.rehab.includes("rotator-cuff"), false);
  check("neck not swept", LEGACY_SLUGS.rehab.includes("neck"), false);
}


console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);

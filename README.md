# D.O.M.S

**D**elayed **O**nset **M**uscle **S**oreness — an opinionated, mobile-first workout tracker for Obsidian.

Most workout apps optimise for logging detail. This one optimises for **showing up**. No weights, no reps, no PRs, no exercise names in the log — just sets per muscle group, and whether you completed your week.

Your training history is plain markdown in your own vault. If this plugin disappears tomorrow, your data is still readable, queryable, and yours.

---

## What it does

**Week** — your routine as a set of slots. Tap one, count your sets as you go, log it. One tap logs the whole session as planned if you did exactly that. Trained something the session doesn't list? Tap **+** to add any body part — abs after push day, grip work, whatever it was — and it logs like the rest.

Counting is saved as you go. Put your phone away between sets, switch to another note, come back tomorrow — the workout is still there, marked **In progress** on its card, with **Continue** and **Discard**. Nothing reaches your log until you commit it, so undo stays a single deleted file.

Forgot yesterday? Every logging screen carries a date, so you can put the session on the day it actually happened. **Log a custom workout** at the bottom of the Week tab covers anything your routine didn't ask for — a missed session, an extra one, or something that fits no template at all. Pick the body parts you trained and log it; change the date in the header if it wasn't today. Backdating reaches 30 days, and a backdated session counts fully toward that week's totals, completion and streak.

**Stats** — sessions, current and best week streak, total sets, a month-by-month activity calendar, and **this week's sets** for each body part against what your routine asks of it, as a bar you can watch move.

**Ideas** — a browsable exercise library across 20 categories, with technique videos. Grouped and collapsed by default, so it opens as a short list rather than a wall of tabs.

**Rehab** — physio-style strengthening for the small stabilising muscles that heavy lifts under-train. Rotator cuff, shoulder blades, hips, adductors, knees, shins, ankles, feet, wrists and more.

---

## Choose your routine

| Routine | Week | Sets |
| --- | --- | --- |
| **Three days a week** *(default)* | Upper · Lower · Full body | ~49 |
| **Upper / lower, five days** | Upper ×2 · Lower ×2 · Cardio | ~64 |
| **Push / pull / legs, seven days** | Push ×2 · Pull ×2 · Legs ×2 · Cardio | ~132 |
| **Custom** | Nothing prescribed — you set the number | — |

On **Custom** there are no preset workouts. Build each session from the body parts you actually trained, and set your own bar for the week in settings. Any workout you log counts toward it, whatever it was, and — as on every other routine — extra sessions are a bonus that never raises the bar.

Weekly volume targets are **derived from whichever routine you pick**, never hardcoded, so a perfectly executed week never reads as a failure. Push / pull / legs is sized so every tracked body part lands on twelve sets a week — six gym days should deliver more than three.

Body parts that carry a target are the ones a routine is built around. Abs and rehab work don't: they're logged and counted the same way, and show up in your stats as sets done, but no bar ever tells you that you owe rotator cuff work.

Each session records the routine you were following at the time, so switching later leaves your past weeks judged by what you actually did.

---

## Your data

One markdown note per session, in a folder you choose:

```markdown
---
doms: session
date: 2026-07-30
week: 2026-W31
template: lower
plan: three-day
slot: required
sets:
  quads: 5
  hamstrings: 4
  glutes: 4
  calves: 3
total_sets: 16
---

Felt strong. Knee twinge on the last set of extensions.
```

Flat frontmatter, so Dataview and Bases can query your training history without the plugin. Your notes below the frontmatter are never touched.

---

## Widgets

Three blocks you can embed in any note. They are **in-note widgets, not home screen widgets** — Obsidian's mobile apps ship a fixed set of OS widgets and there is no API for a plugin to add to it. For a home screen tap, see [One tap from your home screen](#one-tap-from-your-home-screen) below.

Each has an "Insert …" command, so you do not have to type the fence by hand: open the command palette in a note and search for `D.O.M.S: Insert`.

**Activity** — days trained this month.

````markdown
```doms-activity
view: calendar
```
````

`view: dots` for a compact version, `summary: false` to hide the count.

**Quote of the day** — one line, the same all day, no repaint flicker.

````markdown
```doms-quote
category: stoicism
```
````

Categories: `lifting`, `combat`, `anime`, `games`, `philosophy`. Omit for any.

**Quick log** — a big button straight to the logging screen.

````markdown
```doms-log
session: upper
```
````

Unrecognised options fall back to the default rather than breaking your note.

### One tap from your home screen

The plugin registers a URL scheme, so an Apple Shortcut or Android shortcut can jump straight to logging:

```
obsidian://doms?action=log&session=upper
```

There's also a **Quick log a session** command, which you can add to the Obsidian mobile toolbar to reach it from anywhere in the app.

*Honest limitation:* the shortcut still cold-launches Obsidian. It gets you one tap from your home screen to the logging screen — it can't log in the background. No plugin can.

---

## Appearance

D.O.M.S inherits your theme by default. There's an accent picker with six presets if you want it, plus block-letter titles you can switch off or resize.

Everything is scoped to the plugin, so a preset can never leak into the rest of your vault. To style it yourself, target:

```css
.doms-view { --doms-accent: #yourcolour; }
```

For a celebration with your own images, point **Settings → Celebration** at a vault folder of png, jpg or gif files.

---

## Installing

**From Obsidian** — Settings → Community plugins → Browse → search "D.O.M.S".

**Manually** — download `main.js`, `manifest.json` and `styles.css` from the [latest release](../../releases/latest) into `<vault>/.obsidian/plugins/doms/`, then enable it in Settings → Community plugins.

Works on desktop and mobile. No internet connection required.

---

## Getting started

1. Open D.O.M.S from the ribbon icon or the command palette
2. Pick your routine in **Settings → Plan** (three days a week is the default)
3. Tap a slot on the **Week** tab and log your first session
4. On **Ideas** or **Rehab**, tap **Add starter content** to seed the exercise library into your vault — it's markdown you own and can edit

---

## Notes on the exercise library

The Ideas and Rehab content is seeded into your vault as markdown notes you own. Add your own entries, delete ones you don't want, or rewrite them entirely — the plugin reads them and never overwrites your edits.

Videos link out to their creators on YouTube. Nothing is embedded or reproduced; every link is attributed on the card.

The Rehab tab is general information, not a substitute for a clinician's guidance. If something is getting worse, get it looked at.

---

## Licence

MIT

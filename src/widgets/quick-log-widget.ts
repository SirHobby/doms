import { setIcon } from "obsidian";
import { findTemplate, type Template } from "../data/templates";
import type { WidgetSource } from "./options";

export interface QuickLogOptions {
  /** Template id to pre-select, or null to land on the week. */
  session: string | null;
  label: string | null;
}

/** Friendly names people will actually type in a code block. */
const SESSION_ALIASES: Record<string, string> = {
  upper: "upper",
  "upper body": "upper",
  "upper-body": "upper",
  lower: "lower",
  "lower body": "lower",
  "lower-body": "lower",
  full: "full",
  "full body": "full",
  "full-body": "full",
  push: "push",
  pull: "pull",
  legs: "legs",
  leg: "legs",
  cardio: "cardio",
  rehab: "rehab",
  other: "other",
};

export function resolveSession(value: string | undefined): string | null {
  if (!value) return null;
  return SESSION_ALIASES[value.trim().toLowerCase()] ?? null;
}

export function quickLogOptions(source: WidgetSource): QuickLogOptions {
  return {
    session: resolveSession(source.session),
    label: source.label?.trim() || null,
  };
}

export interface QuickLogInput {
  options: QuickLogOptions;
  templates: readonly Template[];
}

/**
 * One big button that goes straight to logging.
 *
 * No confirmation, no intermediate screen: the whole point is someone standing
 * between sets with one hand free.
 */
export function renderQuickLogWidget(
  containerEl: HTMLElement,
  input: QuickLogInput,
  onLog: (session: string | null) => void,
): void {
  containerEl.empty();

  const { session, label } = input.options;
  const template: Template | null = session
    ? findTemplate(session, input.templates)
    : null;

  const root = containerEl.createDiv({ cls: "doms-widget-quicklog" });

  const button = root.createEl("button", { cls: "doms-widget-logbutton" });
  button.type = "button";

  const icon = button.createSpan({ cls: "doms-widget-logicon" });
  icon.setAttribute("aria-hidden", "true");
  setIcon(icon, "dumbbell");

  const text = button.createSpan({ cls: "doms-widget-logtext" });
  text.setText(label ?? (template ? `Log ${template.name}` : "Log a session"));

  // A requested session that does not exist should still get you to the app.
  if (session && !template) {
    root.createDiv({
      cls: "doms-widget-note",
      text: `Unknown session "${session}". Opening the week instead.`,
    });
  }

  button.addEventListener("click", () => onLog(template ? template.id : null));
}

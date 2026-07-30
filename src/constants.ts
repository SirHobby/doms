export const VIEW_TYPE_DOMS = "doms-view";

export const DOMS_ICON = "dumbbell";

export const DOMS_DISPLAY_NAME = "D.O.M.S";

export const TAB_IDS = ["week", "stats", "ideas", "rehab"] as const;

export type TabId = (typeof TAB_IDS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  week: "Week",
  stats: "Stats",
  ideas: "Ideas",
  rehab: "Rehab",
};

export const DEFAULT_TAB: TabId = "week";

/** Shared id scheme so tabs and panels can point at each other via ARIA. */
export function tabButtonId(id: TabId): string {
  return `doms-tab-${id}`;
}

export function tabPanelId(id: TabId): string {
  return `doms-panel-${id}`;
}

export function isTabId(value: unknown): value is TabId {
  return (
    typeof value === "string" && (TAB_IDS as readonly string[]).includes(value)
  );
}

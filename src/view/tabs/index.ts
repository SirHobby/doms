import { TabId } from "../../constants";
import type { DomsTab } from "./doms-tab";
import { IdeasTab } from "./ideas-tab";
import { RehabTab } from "./rehab-tab";
import { StatsTab } from "./stats-tab";
import { WeekTab } from "./week-tab";

/** One tab instance is alive at a time; the view discards it on switch. */
export function createTab(id: TabId): DomsTab {
  switch (id) {
    case "week":
      return new WeekTab();
    case "stats":
      return new StatsTab();
    case "ideas":
      return new IdeasTab();
    case "rehab":
      return new RehabTab();
  }
}

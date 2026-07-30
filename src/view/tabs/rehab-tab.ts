import { TAB_LABELS, TabId } from "../../constants";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { ContentPanel } from "../content/content-panel";
import { DomsTab, type TabContext } from "./doms-tab";

export class RehabTab extends DomsTab {
  readonly id: TabId = "rehab";
  readonly heading = TAB_LABELS.rehab;
  readonly asciiKey: AsciiKey = "REHAB";

  protected renderBody(root: HTMLElement, context: TabContext): void {
    this.addChild(
      new ContentPanel(root, {
        plugin: context.plugin,
        category: "rehab",
        prompt: "Something bothering you?",
        // Required by spec §4.6: short, and not alarming.
        disclaimer:
          "General information only, not a substitute for a clinician's guidance. If something is getting worse, get it looked at.",
      }),
    );
  }
}

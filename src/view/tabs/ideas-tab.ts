import { TAB_LABELS, TabId } from "../../constants";
import type { AsciiKey } from "../../ui/ascii-fonts";
import { ContentPanel } from "../content/content-panel";
import { DomsTab, type TabContext } from "./doms-tab";

export class IdeasTab extends DomsTab {
  readonly id: TabId = "ideas";
  readonly heading = TAB_LABELS.ideas;
  readonly asciiKey: AsciiKey = "IDEAS";

  protected renderBody(root: HTMLElement, context: TabContext): void {
    this.addChild(
      new ContentPanel(root, {
        plugin: context.plugin,
        category: "ideas",
        prompt: "Need workout ideas?",
      }),
    );
  }
}

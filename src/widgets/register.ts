import type { Editor, MarkdownPostProcessorContext } from "obsidian";
import { QUOTES, pickQuote, type Quote } from "../data/quotes";
import { loadQuoteBank } from "../data/quote-store";
import type DomsPlugin from "../main";
import {
  activityOptions,
  renderActivityWidget,
  type ActivityOptions,
} from "./activity-widget";
import { parseWidgetSource } from "./options";
import {
  quickLogOptions,
  renderQuickLogWidget,
  type QuickLogOptions,
} from "./quick-log-widget";
import { quoteOptions, renderQuoteWidget, type QuoteOptions } from "./quote-widget";
import { DomsWidgetBlock } from "./widget-block";

class ActivityBlock extends DomsWidgetBlock {
  constructor(
    el: HTMLElement,
    plugin: DomsPlugin,
    private readonly options: ActivityOptions,
  ) {
    super(el, plugin);
  }

  protected paint(): void {
    const { data } = this.plugin;
    renderActivityWidget(this.containerEl, {
      sessions: data.sessions(),
      stats: data.options,
      options: this.options,
    });
  }
}

class QuoteBlock extends DomsWidgetBlock {
  private bank: readonly Quote[] = QUOTES;
  private override: Quote | null = null;

  constructor(
    el: HTMLElement,
    plugin: DomsPlugin,
    private readonly options: QuoteOptions,
  ) {
    super(el, plugin);
  }

  /** The quote does not come from the log folder, so nothing to watch. */
  protected get watchesVault(): boolean {
    return false;
  }

  protected paint(): void {
    renderQuoteWidget(
      this.containerEl,
      { bank: this.bank, options: this.options, quote: this.override },
      () => {
        // An explicit reroll is a user action; the default stays date-seeded.
        this.override = pickQuote(
          this.options.category
            ? this.bank.filter((q) => q.category === this.options.category)
            : this.bank,
        );
        this.paint();
      },
    );
  }

  onload(): void {
    super.onload();
    void loadQuoteBank(
      this.plugin.app,
      this.plugin.settings.rootFolder,
    ).then((bank) => {
      this.bank = bank;
      this.paint();
    });
  }
}

class QuickLogBlock extends DomsWidgetBlock {
  constructor(
    el: HTMLElement,
    plugin: DomsPlugin,
    private readonly options: QuickLogOptions,
  ) {
    super(el, plugin);
  }

  protected get watchesVault(): boolean {
    return false;
  }

  protected paint(): void {
    renderQuickLogWidget(
      this.containerEl,
      { options: this.options, templates: this.plugin.data.templates },
      (session) => void this.plugin.quickLog(session ?? undefined),
    );
  }
}

/**
 * Wires the widgets into notes.
 *
 * Each block hands off to the same render function the view uses, so there is
 * one implementation per widget rather than two that drift apart.
 */
export function registerWidgets(plugin: DomsPlugin): void {
  const block =
    <T>(
      parse: (source: ReturnType<typeof parseWidgetSource>) => T,
      make: (el: HTMLElement, p: DomsPlugin, options: T) => DomsWidgetBlock,
    ) =>
    (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      const options = parse(parseWidgetSource(source));
      // addChild is what ties the listeners to the block's lifetime.
      ctx.addChild(make(el, plugin, options));
    };

  plugin.registerMarkdownCodeBlockProcessor(
    "doms-activity",
    block(activityOptions, (el, p, o) => new ActivityBlock(el, p, o)),
  );
  plugin.registerMarkdownCodeBlockProcessor(
    "doms-quote",
    block(quoteOptions, (el, p, o) => new QuoteBlock(el, p, o)),
  );
  plugin.registerMarkdownCodeBlockProcessor(
    "doms-log",
    block(quickLogOptions, (el, p, o) => new QuickLogBlock(el, p, o)),
  );

  registerInsertCommands(plugin);
}

/**
 * The widgets are code blocks, which means the only way to get one is to type
 * the fence by hand and remember the option keys. These commands make them
 * findable the way everything else in Obsidian is findable — through the
 * command palette, which on mobile is also what the toolbar pulls from.
 */
function registerInsertCommands(plugin: DomsPlugin): void {
  const widgets: ReadonlyArray<{ id: string; name: string; body: string }> = [
    {
      id: "insert-activity-widget",
      name: "Insert activity calendar",
      body: "doms-activity\nview: calendar\n",
    },
    {
      id: "insert-quote-widget",
      name: "Insert quote of the day",
      body: "doms-quote\n",
    },
    {
      id: "insert-log-widget",
      name: "Insert quick log button",
      body: "doms-log\n",
    },
  ];

  for (const widget of widgets) {
    plugin.addCommand({
      id: widget.id,
      name: widget.name,
      editorCallback: (editor: Editor) => {
        // Trailing newline so the cursor lands on a clean line under the block
        // rather than glued to the closing fence.
        editor.replaceSelection("```" + widget.body + "```\n");
      },
    });
  }
}

import { App, Modal, Setting } from "obsidian";

export interface ConfirmOptions {
  title: string;
  /** Each string becomes its own paragraph. */
  body: string[];
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

/** Small yes/no modal. Used where an action changes files on disk. */
export class ConfirmModal extends Modal {
  constructor(
    app: App,
    private readonly options: ConfirmOptions,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    this.titleEl.setText(this.options.title);

    for (const paragraph of this.options.body) {
      contentEl.createEl("p", { text: paragraph });
    }

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.options.cancelText ?? "Cancel")
          .onClick(() => this.close()),
      )
      .addButton((button) =>
        button
          .setButtonText(this.options.confirmText)
          .setCta()
          .onClick(async () => {
            this.close();
            await this.options.onConfirm();
          }),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

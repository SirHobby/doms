import { Component } from "obsidian";
import { videoUrl, type ContentExercise } from "../../data/content";
import type { ContentVideo } from "../../data/content-videos";

/** One exercise: name, a line of coaching, and any verified video references. */
export class LinkCard extends Component {
  constructor(
    private readonly parent: HTMLElement,
    private readonly exercise: ContentExercise,
  ) {
    super();
  }

  onload(): void {
    const { name, note, videos } = this.exercise;

    const card = this.parent.createDiv({ cls: "doms-card" });
    this.register(() => card.detach());

    card.createDiv({ cls: "doms-card-title", text: name });
    if (note) card.createDiv({ cls: "doms-card-desc", text: note });

    if (videos.length > 0) {
      const list = card.createDiv({ cls: "doms-video-list" });
      for (const v of videos) renderVideo(list, v);
    }
  }
}

/**
 * Videos are the only links in the library. The creator is always shown: these
 * are third party links, not plugin content.
 */
export function renderVideo(parent: HTMLElement, video: ContentVideo): void {
  const link = parent.createEl("a", { cls: "doms-video external-link" });
  link.href = videoUrl(video.id);
  // Opens in the system browser rather than an in-app webview.
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  link.createSpan({ cls: "doms-video-icon", text: "▶" });

  const text = link.createDiv({ cls: "doms-video-text" });
  text.createDiv({ cls: "doms-video-title", text: video.title });
  text.createDiv({ cls: "doms-video-source", text: video.source });
}

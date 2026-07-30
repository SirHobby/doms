import type { ContentVideo } from "./content-videos";
import type { ContentCategory } from "./content";

export interface SeedExercise {
  name: string;
  note: string;
  /** Verified YouTube references. The only links in the library. */
  videos?: ContentVideo[];
}

export interface SeedNote {
  category: ContentCategory;
  /** Picker grouping, e.g. "push". */
  group: string;
  slug: string;
  title: string;
  subtitle: string;
  /** Rendered as a distinct callout above the list. */
  caution?: string;
  note?: string;
  /** Category level videos, shown once under the heading. */
  videos?: ContentVideo[];
  exercises: SeedExercise[];
}

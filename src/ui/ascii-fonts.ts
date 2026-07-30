/**
 * Precomputed banner strings (spec §7).
 *
 * Five fixed titles do not justify bundling a figlet implementation, so these
 * are generated once by tools/gen-ascii.mjs and pasted here as literals. That
 * script also owns the per-glyph table; if you need a sixth title, edit it there
 * and re-paste rather than hand-editing these strings — every row in a banner
 * must be exactly the same length or the fit calculation is wrong.
 *
 * Solid block glyphs (U+2588, plus U+2580/U+2584 halves in the compact face).
 * The original / _ | line font visibly came apart at full size: its strokes are
 * thin marks positioned within the em box, so nothing joins up. Block glyphs
 * fill their cell and tile seamlessly at line-height 1.
 */

export const ASCII_KEYS = ["DOMS", "WEEK", "STATS", "IDEAS", "REHAB"] as const;

export type AsciiKey = (typeof ASCII_KEYS)[number];

/** Three rows, half-block face. Default on mobile. */
export const ASCII_COMPACT: Record<AsciiKey, string> = {
  DOMS: [
    "█▀▀▄ ▄▀▀▄ █▄ ▄█ ▄▀▀▀",
    "█  █ █  █ █ ▀ █ ▀▀▀▄",
    "█▄▄▀ ▀▄▄▀ █   █ ▀▄▄▀",
  ].join("\n"),
  WEEK: [
    "█   █ █▀▀▀ █▀▀▀ █ ▄▀",
    "█ ▄ █ █▀▀  █▀▀  █▀▄ ",
    "▀▄▀▄▀ █▄▄▄ █▄▄▄ █  ▀",
  ].join("\n"),
  STATS: [
    "▄▀▀▀ ▀▀█▀▀ ▄▀▀▄ ▀▀█▀▀ ▄▀▀▀",
    "▀▀▀▄   █   █▄▄█   █   ▀▀▀▄",
    "▀▄▄▀   █   █  █   █   ▀▄▄▀",
  ].join("\n"),
  IDEAS: [
    "▀█▀ █▀▀▄ █▀▀▀ ▄▀▀▄ ▄▀▀▀",
    " █  █  █ █▀▀  █▄▄█ ▀▀▀▄",
    "▄█▄ █▄▄▀ █▄▄▄ █  █ ▀▄▄▀",
  ].join("\n"),
  REHAB: [
    "█▀▀▄ █▀▀▀ █  █ ▄▀▀▄ █▀▀▄",
    "█▀▀▄ █▀▀  █▀▀█ █▄▄█ █▀▀▄",
    "█  █ █▄▄▄ █  █ █  █ █▄▄▀",
  ].join("\n"),
};

/** Five rows, solid block face. Default on desktop. */
export const ASCII_FULL: Record<AsciiKey, string> = {
  DOMS: [
    "████   ███  █   █ █████",
    "█   █ █   █ ██ ██ █    ",
    "█   █ █   █ █ █ █ █████",
    "█   █ █   █ █   █     █",
    "████   ███  █   █ █████",
  ].join("\n"),
  WEEK: [
    "█   █ █████ █████ █   █",
    "█   █ █     █     █  █ ",
    "█ █ █ ████  ████  ███  ",
    "██ ██ █     █     █  █ ",
    "█   █ █████ █████ █   █",
  ].join("\n"),
  STATS: [
    "█████ █████  ███  █████ █████",
    "█       █   █   █   █   █    ",
    "█████   █   █████   █   █████",
    "    █   █   █   █   █       █",
    "█████   █   █   █   █   █████",
  ].join("\n"),
  IDEAS: [
    "█████ ████  █████  ███  █████",
    "  █   █   █ █     █   █ █    ",
    "  █   █   █ ████  █████ █████",
    "  █   █   █ █     █   █     █",
    "█████ ████  █████ █   █ █████",
  ].join("\n"),
  REHAB: [
    "████  █████ █   █  ███  ████ ",
    "█   █ █     █   █ █   █ █   █",
    "████  ████  █████ █████ ████ ",
    "█  █  █     █   █ █   █ █   █",
    "█   █ █████ █   █ █   █ ████ ",
  ].join("\n"),
};

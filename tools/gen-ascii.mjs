// Generates the banner constants in src/ui/ascii-fonts.ts.
// Run: node tools/gen-ascii.mjs   then paste the block after ----8<---- .
// Not part of the build.

// Solid block letters. U+2588 tiles with no gaps at line-height 1, which the
// old / _ | line font could not do — at full size its strokes visibly came
// apart. Every glyph in a family must be the same width.
const FULL = {
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  D: ["████ ", "█   █", "█   █", "█   █", "████ "],
  E: ["█████", "█    ", "████ ", "█    ", "█████"],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  S: ["█████", "█    ", "█████", "    █", "█████"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
};

// Three rows needs half blocks (▀ ▄) to stay legible — solid-only letters at
// this height collapse into indistinguishable rectangles.
const COMPACT = {
  A: ["▄▀▀▄", "█▄▄█", "█  █"],
  B: ["█▀▀▄", "█▀▀▄", "█▄▄▀"],
  D: ["█▀▀▄", "█  █", "█▄▄▀"],
  E: ["█▀▀▀", "█▀▀ ", "█▄▄▄"],
  H: ["█  █", "█▀▀█", "█  █"],
  I: ["▀█▀", " █ ", "▄█▄"],
  K: ["█ ▄▀", "█▀▄ ", "█  ▀"],
  M: ["█▄ ▄█", "█ ▀ █", "█   █"],
  O: ["▄▀▀▄", "█  █", "▀▄▄▀"],
  R: ["█▀▀▄", "█▀▀▄", "█  █"],
  S: ["▄▀▀▀", "▀▀▀▄", "▀▄▄▀"],
  T: ["▀▀█▀▀", "  █  ", "  █  "],
  W: ["█   █", "█ ▄ █", "▀▄▀▄▀"],
};

const TITLES = ["DOMS", "WEEK", "STATS", "IDEAS", "REHAB"];

function render(font, word, rows) {
  const lines = [];
  for (let r = 0; r < rows; r++) {
    lines.push(
      [...word]
        .map((ch) => {
          const glyph = font[ch];
          if (!glyph) throw new Error(`missing glyph ${ch}`);
          return glyph[r];
        })
        .join(" "),
    );
  }
  const widths = new Set(lines.map((l) => [...l].length));
  if (widths.size !== 1) {
    throw new Error(`${word}: ragged rows ${[...widths].join(",")}`);
  }
  return lines;
}

// Each glyph must also be internally rectangular, or the join above misaligns.
for (const [name, font] of [["FULL", FULL], ["COMPACT", COMPACT]]) {
  for (const [ch, glyph] of Object.entries(font)) {
    const widths = new Set(glyph.map((row) => [...row].length));
    if (widths.size !== 1) {
      throw new Error(`${name} ${ch}: ragged glyph ${[...widths].join(",")}`);
    }
  }
}

for (const t of TITLES) {
  console.log(`\n${t} — full (${[...render(FULL, t, 5)[0]].length} cols)`);
  for (const l of render(FULL, t, 5)) console.log(l);
  console.log(`${t} — compact (${[...render(COMPACT, t, 3)[0]].length} cols)`);
  for (const l of render(COMPACT, t, 3)) console.log(l);
}

function emit(name, font, rows) {
  console.log(`export const ${name}: Record<AsciiKey, string> = {`);
  for (const t of TITLES) {
    console.log(`  ${t}: [`);
    for (const l of render(font, t, rows)) console.log(`    ${JSON.stringify(l)},`);
    console.log(`  ].join("\\n"),`);
  }
  console.log(`};\n`);
}

console.log("\n----8<----\n");
emit("ASCII_COMPACT", COMPACT, 3);
emit("ASCII_FULL", FULL, 5);

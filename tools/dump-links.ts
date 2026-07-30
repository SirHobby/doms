import { SEED_IDEAS } from "../src/data/seed-ideas";
const seen = new Set<string>();
for (const note of SEED_IDEAS) {
  const rows: [string, string, string][] = [];
  for (const v of note.videos ?? []) rows.push(["(whole category)", v.id, v.title]);
  for (const e of note.exercises) for (const v of e.videos ?? []) rows.push([e.name, v.id, v.title]);
  if (!rows.length) continue;
  console.log(`\n### ${note.title}`);
  for (const [label, id, title] of rows) {
    seen.add(id);
    console.log(`  ${label}`);
    console.log(`    https://www.youtube.com/watch?v=${id}`);
    console.log(`    ${title}`);
  }
}
console.log(`\n${seen.size} unique videos`);

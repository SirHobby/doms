import { readFileSync, writeFileSync } from "node:fs";
const ids = JSON.parse(readFileSync("/tmp/ytids.json", "utf8"));
const out = {};
const dead = [];
for (const id of ids) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "doms-linkcheck/0.1" } });
    if (!res.ok) { dead.push(`${id}  HTTP ${res.status}`); continue; }
    const j = await res.json();
    out[id] = { title: j.title, author: j.author_name };
  } catch (e) {
    dead.push(`${id}  ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 250));
}
writeFileSync("/tmp/ytmeta.json", JSON.stringify(out, null, 2));
console.log("RESOLVED:");
for (const [id, m] of Object.entries(out)) console.log(`  ${id}  [${m.author}]  ${m.title}`);
console.log("\nDEAD (" + dead.length + "):");
dead.forEach(d => console.log("  x " + d));

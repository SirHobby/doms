import { setIcon } from "obsidian";
import type { Quote } from "../data/quotes";

/**
 * Picks an icon that fits what a quote is actually about.
 *
 * Icons are Obsidian's bundled Lucide set, rendered as inline SVG by setIcon.
 * That means they inherit currentColor, scale cleanly, and match the rest of
 * the app rather than looking like something drawn in a text editor.
 *
 * Each rule lists fallbacks because the bundled Lucide version varies between
 * Obsidian releases: if a name is not present, setIcon renders nothing at all,
 * so the renderer walks the list until one produces an <svg>.
 */
interface IconRule {
  /** Primary first, then progressively safer alternatives. */
  icons: string[];
  test: RegExp;
}

const RULES: readonly IconRule[] = [
  // --- specific movements -------------------------------------------------
  { icons: ["dumbbell", "activity"], test: /\bsquat|\bdeadlift|\bbench\b|\bcurl|\brep\b|\breps\b|\bpull[- ]?up|\bpush[- ]?up|\bsit-up/i },
  { icons: ["footprints", "activity"], test: /\brun\b(?! the risk)|\brunning\b|\blap\b|\blaps\b|\bmile|\bsprint/i },
  { icons: ["dumbbell", "activity"], test: /\bweight|\bheavy|\blift|\bmuscle|\bbodybuilder|\bpeanut|\btraining\b|\bgym\b/i },

  // --- named things beat generic themes -----------------------------------
  { icons: ["shield", "shield-half"], test: /\bknight|\barmou?r|\btarnished|\bguardian|\bshinobi|\bninja\b|\bprotect/i },
  { icons: ["crown", "award"], test: /\bking\b|\bhokage|\bhonored one|\bavatar\b|\bpirate|\bchampion|\bhokage/i },
  { icons: ["swords", "sword"], test: /\bsword|\bblade|\bfight|\bbattle|\brival|\bwarrior/i },

  // --- themes -------------------------------------------------------------
  { icons: ["hourglass", "timer", "clock"], test: /\btime\b|\bday\b|\bdays\b|\bpresent\b|\bfuture\b|\btoday\b|\byesterday\b|\bmoment/i },
  { icons: ["mountain", "mountain-snow"], test: /\bjourney|\bthousand miles|\bslowly|\bstep\b|\bclimb|\bmountain|\bendure|\blimits?\b/i },
  { icons: ["flame", "zap"], test: /\bfire\b|\bburn|\bablaze|\bheart|\bsoul\b|\bpain\b|\bsuffer|\bhurt|\bspringtime|\brage\b/i },
  { icons: ["zap", "activity"], test: /\bpower\b|\bstrength\b|\bstronger\b|\bstrong\b|\benergy|\bexplos/i },
  { icons: ["trophy", "award"], test: /\bwin\b|\bwinning\b|\bvictory|\bexcellence|\bgreatest\b|\bbest\b/i },
  { icons: ["award", "medal", "star"], test: /\backnowledg|\bprove\b|\bsplendid|\bgenius\b/i },
  { icons: ["brain", "lightbulb"], test: /\bmind\b|\bthink\b|\bthought|\bwisdom|\bknow\b|\bbelieve|\bimagination|\breason\b|\bdoubt\b/i },
  { icons: ["skull", "ghost"], test: /\bdie\b|\bdeath\b|\bdead\b|\bkill|\bhollow\b|\bforgotten|\bbrutal|\bvicious|\bdarkness\b/i },
  { icons: ["waves", "wind"], test: /\bwater\b|\bocean\b|\bwave|\bflow\b|\bsea\b/i },
  { icons: ["sunrise", "sun"], test: /\bhope\b|\blight\b|\bdark|\bshadow|\bsun\b|\bincandescent|\bpraise|\bmorning/i },
  { icons: ["star", "sparkles"], test: /\bstar\b|\bdream|\bdestiny|\blegend/i },
  { icons: ["sprout", "leaf"], test: /\bbegin|\bstart|\bnew\b|\bchange\b|\bgrow|\byouth\b/i },
  { icons: ["hammer", "target"], test: /\bhit\b|\bpunch|\bkick|\bhard work|\bwork\b|\bdiscipline|\bnever give up|\bnever giving up/i },
  { icons: ["heart", "users"], test: /\bfriend|\blove\b|\btogether|\balone\b|\bpeople\b/i },
  { icons: ["moon", "cloud"], test: /\brest\b|\btroublesome|\bsleep|\btired\b/i },
];

/** Used when nothing matches, keyed by the quote's flavour. */
const BY_CATEGORY: Record<string, string[]> = {
  lifting: ["dumbbell", "activity"],
  combat: ["swords", "sword"],
  anime: ["sparkles", "star"],
  games: ["shield", "sword"],
  philosophy: ["scroll-text", "book-open"],
};

/** Last resort. Present in every Lucide version Obsidian has shipped. */
const FALLBACK = "star";

export function iconNamesForQuote(quote: Quote): string[] {
  const haystack = `${quote.text} ${quote.long ?? ""} ${quote.author}`;

  for (const rule of RULES) {
    if (rule.test.test(haystack)) return [...rule.icons, FALLBACK];
  }

  const byCategory = BY_CATEGORY[quote.category] ?? BY_CATEGORY.lifting;
  return [...byCategory, FALLBACK];
}

/**
 * Renders the first name that actually produces an SVG. A missing icon in
 * Lucide fails silently rather than throwing, so this checks the result rather
 * than trusting the name.
 */
export function renderQuoteIcon(target: HTMLElement, quote: Quote): void {
  for (const name of iconNamesForQuote(quote)) {
    target.empty();
    setIcon(target, name);
    if (target.querySelector("svg")) return;
  }
  target.empty();
  setIcon(target, FALLBACK);
}

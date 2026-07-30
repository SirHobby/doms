/**
 * Code block bodies are parsed as loose `key: value` lines.
 *
 * Fail soft, always: an unknown key, a missing colon or a junk value renders the
 * default rather than throwing. A widget that breaks a user's note because they
 * typed `veiw: month` is worse than one that quietly shows the default.
 */
export type WidgetSource = Record<string, string>;

export function parseWidgetSource(source: string): WidgetSource {
  const out: WidgetSource = {};

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key) out[key] = value;
  }

  return out;
}

/** Reads a value constrained to a known set, falling back on anything else. */
export function pick<T extends string>(
  source: WidgetSource,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = source[key]?.toLowerCase();
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function bool(
  source: WidgetSource,
  key: string,
  fallback = false,
): boolean {
  const value = source[key]?.toLowerCase();
  if (value === "true" || value === "yes" || value === "on") return true;
  if (value === "false" || value === "no" || value === "off") return false;
  return fallback;
}

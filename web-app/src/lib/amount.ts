/**
 * Flexible money entry: "15k", "$15,000", "1.2m", "15000", " 7.5K ". Returns whole dollars, or null if the text
 * isn't a valid non-negative amount. Blank text is null too; callers decide whether blank means zero.
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const match = /^(\d+(?:\.\d+)?|\.\d+)([km])?$/.exec(cleaned);
  if (!match) return null;
  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  return Math.round(Number(match[1]) * multiplier);
}

/** For inputs where blank counts as $0. Invalid text is still null. */
export function parseAmountOrZero(text: string): number | null {
  return text.trim() === "" ? 0 : parseAmount(text);
}

// Presentation cleanup only. Supplier specifications and claims are not rewritten.
export function cleanSupplierText(value: string) {
  return value
    .replace(/\uFFFD/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}
export function cleanImages(values: string[]) {
  const seen = new Set<string>();
  return values.filter((raw) => {
    if (typeof raw !== "string" || !raw.trim()) return false;
    try {
      const u = new URL(raw, "https://plentovo.com");
      if (
        !["https:", "http:"].includes(u.protocol) ||
        (!raw.startsWith("/brand/") && u.protocol !== "https:")
      )
        return false;
      const key = u.origin + u.pathname;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch {
      return false;
    }
  });
}
export function qualityFlags(p: {
  name: string;
  description: string;
  details?: string;
  images: string[];
}) {
  const text = [p.name, p.description, p.details || ""].join(" ");
  const flags: string[] = [];
  if (
    /blood[ -]?pressure|eczema|psoriasis|glucose|oximeter|treat(?:ment|s)?\b|cure\b|pain relief|clinically|medical.grade/i.test(
      text,
    )
  )
    flags.push("Supplier health claim / device documentation review");
  if (/[\uFFFD]|\s\?\s/.test(text))
    flags.push("Supplier text encoding or punctuation review");
  if(!cleanImages(p.images).length)flags.push("No usable product image");
  if (cleanImages(p.images).length < p.images.length)
    flags.push("Blank or duplicate image references");
  return flags;
}

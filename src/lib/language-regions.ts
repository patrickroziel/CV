/**
 * Cultural metadata + simplified country silhouettes for language cards.
 * Paths are stylized (not cartographically perfect) for elegant stroke animations.
 */

export const REGION_LABELS: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  CA: "Canada",
  LU: "Luxembourg",
  MC: "Monaco",
  GB: "Royaume-Uni",
  US: "États-Unis",
  IE: "Irlande",
  AU: "Australie",
  NZ: "Nouvelle-Zélande",
  ZA: "Afrique du Sud",
  IN: "Inde",
  PL: "Pologne",
  DE: "Allemagne",
  LT: "Lituanie",
  UA: "Ukraine",
  ES: "Espagne",
  IT: "Italie",
  PT: "Portugal",
  BR: "Brésil",
  MX: "Mexique",
  AR: "Argentine",
};

/** Flag emoji from ISO alpha-2 */
export function regionFlag(code: string): string {
  const c = code.toUpperCase();
  if (c.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + c.charCodeAt(0) - 65,
    A + c.charCodeAt(1) - 65
  );
}

/**
 * Closed country silhouettes (viewBox 0 0 100 100).
 * Simplified geographic shapes — continuous closed paths for clean draw animation.
 */
export const REGION_PATHS: Record<string, string> = {
  FR: "M38 8 C48 6 58 10 62 18 C68 22 70 32 68 42 C70 52 66 62 58 70 C50 76 40 78 32 74 C24 72 18 64 16 54 C12 44 14 32 18 24 C22 14 28 10 38 8 Z",
  BE: "M28 22 C40 18 56 18 64 26 C68 34 66 48 58 58 C48 66 34 66 26 56 C20 46 20 32 28 22 Z",
  CH: "M34 26 C44 22 56 24 62 34 C64 44 58 56 48 60 C38 62 28 56 26 44 C24 34 28 28 34 26 Z",
  CA: "M10 20 C28 10 48 8 68 16 C78 24 82 40 74 54 C64 68 42 74 24 66 C12 58 6 40 10 20 Z",
  LU: "M36 30 C46 28 54 32 56 42 C54 52 44 56 36 52 C30 46 30 34 36 30 Z",
  MC: "M40 36 C48 34 54 38 54 46 C52 52 44 54 40 50 C36 46 36 38 40 36 Z",
  GB: "M34 10 C46 8 54 14 56 24 C58 34 52 46 44 54 C36 58 28 52 26 40 C24 28 26 14 34 10 Z",
  US: "M6 24 C26 12 50 10 72 20 C86 30 88 48 76 60 C60 72 36 74 18 64 C6 52 2 36 6 24 Z",
  IE: "M32 16 C46 14 56 22 58 36 C56 50 44 60 32 56 C22 48 22 28 32 16 Z",
  AU: "M18 30 C38 16 62 18 74 34 C80 48 72 64 54 70 C34 74 16 60 14 44 C12 36 14 32 18 30 Z",
  NZ: "M42 22 C54 20 62 30 60 44 C56 56 44 62 36 54 C30 44 34 26 42 22 Z",
  ZA: "M24 20 C44 14 62 20 68 38 C70 52 58 66 40 68 C24 64 16 48 18 34 C18 26 20 22 24 20 Z",
  IN: "M34 8 C48 6 58 14 62 28 C66 44 58 62 46 74 C34 78 24 68 22 50 C18 34 22 14 34 8 Z",
  PL: "M24 14 C42 10 60 12 68 28 C72 42 66 58 52 68 C36 72 22 64 18 46 C16 30 18 18 24 14 Z",
  DE: "M28 12 C46 8 62 14 68 30 C70 46 62 62 46 70 C30 70 18 56 18 38 C18 24 22 14 28 12 Z",
  LT: "M30 24 C46 20 58 26 60 40 C58 54 44 60 32 56 C22 48 22 32 30 24 Z",
  UA: "M12 26 C36 14 64 16 78 32 C82 46 72 60 52 66 C30 68 12 56 10 40 C8 32 10 28 12 26 Z",
  ES: "M18 30 C40 18 66 22 74 40 C76 54 62 68 42 70 C24 66 14 50 16 38 C16 34 16 32 18 30 Z",
  IT: "M38 6 C50 8 56 18 54 32 C52 48 48 62 42 76 C34 78 30 68 32 52 C30 36 28 18 38 6 Z",
  PT: "M32 18 C46 14 54 24 52 42 C50 60 40 70 32 66 C26 54 26 32 32 18 Z",
  BR: "M26 12 C48 6 70 14 76 36 C78 54 64 72 42 76 C22 70 12 50 16 32 C18 20 22 14 26 12 Z",
  MX: "M14 30 C36 18 64 22 76 40 C78 54 62 68 40 70 C20 64 10 48 12 38 C12 34 12 32 14 30 Z",
  AR: "M34 8 C50 6 58 18 56 36 C54 56 48 74 38 78 C28 74 24 56 26 36 C26 20 28 10 34 8 Z",
};

export const REGION_CODES = Object.keys(REGION_PATHS);

/**
 * Strong, recognizable symbols — only for the country they belong to.
 * Never mix countries (e.g. no Statue of Liberty for France).
 */
export type CountrySymbols = {
  monuments: string[];
  culture: string[];
};

export const COUNTRY_SYMBOLS: Record<string, CountrySymbols> = {
  FR: { monuments: ["🗼", "🏛️", "⛪"], culture: ["🍷", "🥖", "🧀", "🎨"] },
  BE: { monuments: ["🍫"], culture: ["🍺", "🧇", "🍫"] },
  CH: { monuments: ["⛰️", "🏔️"], culture: ["🧀", "🍫", "⌚"] },
  CA: { monuments: ["🍁"], culture: ["🏒", "🍁", "🦫"] },
  LU: { monuments: ["🏰"], culture: ["🍷", "🏰"] },
  MC: { monuments: ["🏎️"], culture: ["🎰", "⛵"] },
  GB: { monuments: ["🏰", "🎡", "💂"], culture: ["☕", "☔", "🎭"] },
  US: { monuments: ["🗽", "🦅"], culture: ["🎬", "🏈", "🎸"] },
  IE: { monuments: ["☘️", "🏰"], culture: ["🎻", "☘️", "🍺"] },
  AU: { monuments: ["🏛️", "🦘"], culture: ["🪃", "🏄", "🐨"] },
  NZ: { monuments: ["🏔️"], culture: ["🥝", "🏉"] },
  ZA: { monuments: ["🦁"], culture: ["🍷", "🏉"] },
  IN: { monuments: ["🕌", "🏛️"], culture: ["🪔", "🍛", "🪷"] },
  PL: { monuments: ["🏰", "🦅"], culture: ["🥟", "🥖", "🎼"] },
  DE: { monuments: ["🚪", "🏰"], culture: ["🥨", "🍺", "🚗"] },
  LT: { monuments: ["🏰"], culture: ["🏀", "🌲"] },
  UA: { monuments: ["🌻"], culture: ["🌻", "🥟"] },
  ES: { monuments: ["🏛️", "⛪"], culture: ["🎸", "🥘", "💃"] },
  IT: { monuments: ["🏛️", "⛲"], culture: ["🍕", "🍝", "🎭"] },
  PT: { monuments: ["⛪"], culture: ["🥧", "🎸"] },
  BR: { monuments: ["🎭", "🗽"], culture: ["🎉", "⚽", "🏖️"] },
  MX: { monuments: ["🏛️"], culture: ["🌮", "🌶️", "🎸"] },
  AR: { monuments: ["🏔️"], culture: ["🥩", "🍷", "💃"] },
};

export function countryMonuments(code: string): string[] {
  return COUNTRY_SYMBOLS[code.toUpperCase()]?.monuments ?? ["🏛️"];
}

export function countryCulture(code: string): string[] {
  return COUNTRY_SYMBOLS[code.toUpperCase()]?.culture ?? ["🎭"];
}

export function monumentEmoji(primary: string, _languageName?: string): string {
  return countryMonuments(primary)[0] ?? "🏛️";
}

export function cultureEmoji(primary: string, _languageName?: string): string {
  return countryCulture(primary)[0] ?? "🎭";
}

/** Whether an emoji is valid for a given country (monument or culture). */
export function emojiBelongsToCountry(emoji: string, code: string): boolean {
  const c = code.toUpperCase();
  const sym = COUNTRY_SYMBOLS[c];
  if (!sym) return false;
  return sym.monuments.includes(emoji) || sym.culture.includes(emoji);
}

/**
 * Build a clean icon set from associated country codes only.
 * flag + monument + culture (+ outline for primary) per country, capped.
 */
export function defaultIconsForRegions(
  regions: string[],
  languageId = "lang"
): import("./types").LanguageIconItem[] {
  const codes = [...new Set(regions.map((r) => r.toUpperCase()))].filter(
    (c) => REGION_PATHS[c] || COUNTRY_SYMBOLS[c]
  );
  if (codes.length === 0) codes.push("FR");

  const icons: import("./types").LanguageIconItem[] = [];
  let n = 0;
  for (const code of codes) {
    icons.push({
      id: `${languageId}-flag-${code}-${n++}`,
      kind: "flag",
      region: code,
    });
    const mon = countryMonuments(code)[0];
    if (mon) {
      icons.push({
        id: `${languageId}-mon-${code}-${n++}`,
        kind: "monument",
        region: code,
        emoji: mon,
      });
    }
    const cul = countryCulture(code)[0];
    if (cul) {
      icons.push({
        id: `${languageId}-cul-${code}-${n++}`,
        kind: "culture",
        region: code,
        emoji: cul,
      });
    }
  }
  // One outline for the first country
  icons.push({
    id: `${languageId}-outline-${codes[0]}`,
    kind: "outline",
    region: codes[0],
  });
  return icons;
}

/**
 * Keep only icons whose region is in `allowed` (uploads always kept).
 * Fix emoji to match country when mismatched.
 */
export function filterIconsToRegions(
  icons: import("./types").LanguageIconItem[],
  allowedRegions: string[]
): import("./types").LanguageIconItem[] {
  const allowed = new Set(
    allowedRegions.map((r) => r.toUpperCase()).filter(Boolean)
  );
  if (allowed.size === 0) return icons;

  return icons
    .map((icon) => {
      if (icon.kind === "upload") return icon;
      const region = (icon.region || "").toUpperCase();
      if (!region || !allowed.has(region)) return null;

      if (icon.kind === "monument") {
        const mon = countryMonuments(region);
        const emoji =
          icon.emoji && mon.includes(icon.emoji) ? icon.emoji : mon[0];
        return { ...icon, region, emoji };
      }
      if (icon.kind === "culture") {
        const cul = countryCulture(region);
        const emoji =
          icon.emoji && cul.includes(icon.emoji) ? icon.emoji : cul[0];
        return { ...icon, region, emoji };
      }
      return { ...icon, region };
    })
    .filter((x): x is import("./types").LanguageIconItem => Boolean(x));
}

/** @deprecated use countryMonuments / countryCulture */
export const MONUMENT_PRESETS = Object.values(COUNTRY_SYMBOLS).flatMap(
  (s) => s.monuments
);
/** @deprecated use countryMonuments / countryCulture */
export const CULTURE_PRESETS = Object.values(COUNTRY_SYMBOLS).flatMap(
  (s) => s.culture
);

/** Extract first path `d` from SVG markup or data URL */
export function extractSvgPathD(svgSource: string): string | null {
  try {
    let text = svgSource.trim();
    if (text.startsWith("data:image/svg+xml")) {
      const comma = text.indexOf(",");
      const payload = text.slice(comma + 1);
      text = text.includes(";base64,")
        ? atob(payload)
        : decodeURIComponent(payload);
    }
    const match = text.match(/<path[^>]*\sd=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** True if string looks like SVG content or data URL */
export function isSvgSource(value: string): boolean {
  const v = value.trim();
  return (
    v.startsWith("data:image/svg+xml") ||
    v.includes("<svg") ||
    v.startsWith("<?xml")
  );
}

/** Sensible defaults when creating a language by name */
export function defaultRegionsForLanguage(name: string): {
  primaryRegion: string;
  regions: string[];
} {
  const n = name.toLowerCase();
  if (n.includes("franç") || n.includes("french")) {
    return { primaryRegion: "FR", regions: ["FR", "BE", "CH", "CA", "LU"] };
  }
  if (n.includes("angl") || n.includes("english")) {
    return {
      primaryRegion: "GB",
      regions: ["GB", "US", "CA", "AU", "IE", "NZ"],
    };
  }
  if (n.includes("polon") || n.includes("polish")) {
    return { primaryRegion: "PL", regions: ["PL", "LT", "UA", "DE"] };
  }
  if (n.includes("espagn") || n.includes("spanish")) {
    return { primaryRegion: "ES", regions: ["ES", "MX", "AR", "US"] };
  }
  if (n.includes("allemand") || n.includes("german")) {
    return { primaryRegion: "DE", regions: ["DE", "AT", "CH"] };
  }
  if (n.includes("italien") || n.includes("italian")) {
    return { primaryRegion: "IT", regions: ["IT", "CH"] };
  }
  return { primaryRegion: "FR", regions: ["FR"] };
}

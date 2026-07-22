/**
 * Auto-fill LocalizedString for FR / EN / PL / ES.
 * 1) Dictionary (language names, levels, countries) for quality
 * 2) MyMemory free API for remaining locales
 * 3) Fallback: copy source text into empty locales
 */

import type { Locale } from "@/i18n/locales";
import { LOCALES } from "@/i18n/locales";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
  type MaybeLocalized,
} from "@/lib/i18n-content";

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Known language names (any side maps to full 4-locale set) */
const LANGUAGE_NAMES: LocalizedString[] = [
  { fr: "Français", en: "French", pl: "Francuski", es: "Francés" },
  { fr: "Anglais", en: "English", pl: "Angielski", es: "Inglés" },
  { fr: "Polonais", en: "Polish", pl: "Polski", es: "Polaco" },
  { fr: "Espagnol", en: "Spanish", pl: "Hiszpański", es: "Español" },
  { fr: "Allemand", en: "German", pl: "Niemiecki", es: "Alemán" },
  { fr: "Italien", en: "Italian", pl: "Włoski", es: "Italiano" },
  { fr: "Portugais", en: "Portuguese", pl: "Portugalski", es: "Portugués" },
  { fr: "Néerlandais", en: "Dutch", pl: "Niderlandzki", es: "Neerlandés" },
  { fr: "Russe", en: "Russian", pl: "Rosyjski", es: "Ruso" },
  { fr: "Arabe", en: "Arabic", pl: "Arabski", es: "Árabe" },
  { fr: "Chinois", en: "Chinese", pl: "Chiński", es: "Chino" },
  { fr: "Japonais", en: "Japanese", pl: "Japoński", es: "Japonés" },
  { fr: "Coréen", en: "Korean", pl: "Koreański", es: "Coreano" },
  { fr: "Turc", en: "Turkish", pl: "Turecki", es: "Turco" },
  { fr: "Ukrainien", en: "Ukrainian", pl: "Ukraiński", es: "Ucraniano" },
  { fr: "Roumain", en: "Romanian", pl: "Rumuński", es: "Rumano" },
  { fr: "Grec", en: "Greek", pl: "Grecki", es: "Griego" },
  { fr: "Suédois", en: "Swedish", pl: "Szwedzki", es: "Sueco" },
  { fr: "Norvégien", en: "Norwegian", pl: "Norweski", es: "Noruego" },
  { fr: "Danois", en: "Danish", pl: "Duński", es: "Danés" },
  { fr: "Finnois", en: "Finnish", pl: "Fiński", es: "Finés" },
  { fr: "Tchèque", en: "Czech", pl: "Czeski", es: "Checo" },
  { fr: "Hongrois", en: "Hungarian", pl: "Węgierski", es: "Húngaro" },
  { fr: "Hindi", en: "Hindi", pl: "Hindi", es: "Hindi" },
  { fr: "Catalan", en: "Catalan", pl: "Kataloński", es: "Catalán" },
];

/** Proficiency levels (incl. casual / custom portfolio phrases) */
const LEVELS: LocalizedString[] = [
  { fr: "Natif", en: "Native", pl: "Ojczysty", es: "Nativo" },
  {
    fr: "Bilingue",
    en: "Bilingual",
    pl: "Dwujęzyczny",
    es: "Bilingüe",
  },
  { fr: "Courant", en: "Fluent", pl: "Biegły", es: "Fluido" },
  {
    fr: "Courant C1",
    en: "Fluent C1",
    pl: "Biegły C1",
    es: "Fluido C1",
  },
  {
    fr: "Courant C2",
    en: "Fluent C2",
    pl: "Biegły C2",
    es: "Fluido C2",
  },
  {
    fr: "Intermédiaire",
    en: "Intermediate",
    pl: "Średniozaawansowany",
    es: "Intermedio",
  },
  {
    fr: "Intermédiaire B1",
    en: "Intermediate B1",
    pl: "Średniozaawansowany B1",
    es: "Intermedio B1",
  },
  {
    fr: "Intermédiaire B2",
    en: "Intermediate B2",
    pl: "Średniozaawansowany B2",
    es: "Intermedio B2",
  },
  {
    fr: "Notions",
    en: "Basic",
    pl: "Podstawowy",
    es: "Básico",
  },
  {
    fr: "Débutant",
    en: "Beginner",
    pl: "Początkujący",
    es: "Principiante",
  },
  {
    fr: "Professionnel",
    en: "Professional",
    pl: "Profesjonalny",
    es: "Profesional",
  },
  {
    fr: "Conversationnel",
    en: "Conversational",
    pl: "Konwersacyjny",
    es: "Conversacional",
  },
  {
    fr: "Je me débrouille",
    en: "I get by",
    pl: "Radzę sobie",
    es: "Me defiendo",
  },
  {
    fr: "Je me débrouille… pas vraiment lol",
    en: "I get by… not really lol",
    pl: "Radzę sobie… no nie bardzo lol",
    es: "Me defiendo… la verdad no mucho lol",
  },
  {
    // variants without ellipsis / punctuation
    fr: "Je me débrouille.. pas vraiment lol",
    en: "I get by.. not really lol",
    pl: "Radzę sobie.. no nie bardzo lol",
    es: "Me defiendo.. la verdad no mucho lol",
  },
  {
    fr: "Je me débrouille, pas vraiment lol",
    en: "I get by, not really lol",
    pl: "Radzę sobie, no nie bardzo lol",
    es: "Me defiendo, la verdad no mucho lol",
  },
  {
    fr: "Scolaire",
    en: "School level",
    pl: "Szkolny",
    es: "Nivel escolar",
  },
  {
    fr: "En apprentissage",
    en: "Learning",
    pl: "W trakcie nauki",
    es: "En aprendizaje",
  },
];

/** Country / region labels (ISO → 4 locales) */
export const REGION_LABELS_I18N: Record<string, LocalizedString> = {
  FR: { fr: "France", en: "France", pl: "Francja", es: "Francia" },
  BE: { fr: "Belgique", en: "Belgium", pl: "Belgia", es: "Bélgica" },
  CH: { fr: "Suisse", en: "Switzerland", pl: "Szwajcaria", es: "Suiza" },
  CA: { fr: "Canada", en: "Canada", pl: "Kanada", es: "Canadá" },
  LU: { fr: "Luxembourg", en: "Luxembourg", pl: "Luksemburg", es: "Luxemburgo" },
  MC: { fr: "Monaco", en: "Monaco", pl: "Monako", es: "Mónaco" },
  GB: {
    fr: "Royaume-Uni",
    en: "United Kingdom",
    pl: "Wielka Brytania",
    es: "Reino Unido",
  },
  US: {
    fr: "États-Unis",
    en: "United States",
    pl: "Stany Zjednoczone",
    es: "Estados Unidos",
  },
  IE: { fr: "Irlande", en: "Ireland", pl: "Irlandia", es: "Irlanda" },
  AU: { fr: "Australie", en: "Australia", pl: "Australia", es: "Australia" },
  NZ: {
    fr: "Nouvelle-Zélande",
    en: "New Zealand",
    pl: "Nowa Zelandia",
    es: "Nueva Zelanda",
  },
  ZA: {
    fr: "Afrique du Sud",
    en: "South Africa",
    pl: "Republika Południowej Afryki",
    es: "Sudáfrica",
  },
  IN: { fr: "Inde", en: "India", pl: "Indie", es: "India" },
  PL: { fr: "Pologne", en: "Poland", pl: "Polska", es: "Polonia" },
  DE: { fr: "Allemagne", en: "Germany", pl: "Niemcy", es: "Alemania" },
  AT: { fr: "Autriche", en: "Austria", pl: "Austria", es: "Austria" },
  LT: { fr: "Lituanie", en: "Lithuania", pl: "Litwa", es: "Lituania" },
  UA: { fr: "Ukraine", en: "Ukraine", pl: "Ukraina", es: "Ucrania" },
  ES: { fr: "Espagne", en: "Spain", pl: "Hiszpania", es: "España" },
  IT: { fr: "Italie", en: "Italy", pl: "Włochy", es: "Italia" },
  PT: { fr: "Portugal", en: "Portugal", pl: "Portugalia", es: "Portugal" },
  BR: { fr: "Brésil", en: "Brazil", pl: "Brazylia", es: "Brasil" },
  MX: { fr: "Mexique", en: "Mexico", pl: "Meksyk", es: "México" },
  AR: { fr: "Argentine", en: "Argentina", pl: "Argentyna", es: "Argentina" },
  CO: { fr: "Colombie", en: "Colombia", pl: "Kolumbia", es: "Colombia" },
  CL: { fr: "Chili", en: "Chile", pl: "Chile", es: "Chile" },
};

/** Loosen punctuation so "a.. b" ≈ "a… b" ≈ "a, b" */
function normLoose(s: string): string {
  return norm(s)
    .replace(/[.…,;:!?'"«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupDictionary(text: string): LocalizedString | null {
  const key = norm(text);
  const keyLoose = normLoose(text);
  if (!key) return null;

  const pool = [...LANGUAGE_NAMES, ...LEVELS, ...Object.values(REGION_LABELS_I18N)];

  for (const entry of pool) {
    for (const loc of LOCALES) {
      const v = entry[loc];
      if (!v) continue;
      if (norm(v) === key || normLoose(v) === keyLoose) {
        return { ...entry };
      }
    }
  }

  return null;
}

/**
 * Sync expand from dictionary only (safe in normalize / load).
 * If the text matches a known phrase, returns all 4 locales.
 */
export function expandLocalizedSync(
  value: MaybeLocalized
): LocalizedString {
  const base = liftToLocalized(value);
  const source = getL(base, "fr") || getL(base);
  if (!source) return base;
  const dict = lookupDictionary(source);
  if (dict) return { ...dict };
  // Also try each filled locale as lookup key
  for (const loc of LOCALES) {
    const v = base[loc]?.trim();
    if (!v) continue;
    const d = lookupDictionary(v);
    if (d) return { ...d };
  }
  return base;
}

/** True if any of FR/EN/PL/ES is missing */
export function hasMissingLocale(value: MaybeLocalized): boolean {
  const base = liftToLocalized(value);
  return LOCALES.some((loc) => !base[loc]?.trim());
}

/** Localized labels for a country code */
export function localizedRegionLabel(code: string): LocalizedString {
  const c = code.toUpperCase();
  if (REGION_LABELS_I18N[c]) return { ...REGION_LABELS_I18N[c] };
  return { fr: c, en: c, pl: c, es: c };
}

async function translateOne(
  text: string,
  from: Locale,
  to: Locale
): Promise<string | null> {
  if (from === to) return text;
  if (!text.trim()) return null;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${from}|${to}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const t = data.responseData?.translatedText?.trim();
    if (!t || t.toUpperCase() === "INVALID SOURCE LANGUAGE") return null;
    // MyMemory sometimes returns the query back with "PLEASE SELECT..."
    if (/MYMEMORY WARNING/i.test(t)) return null;
    return t;
  } catch {
    return null;
  }
}

/**
 * Build a full FR/EN/PL/ES LocalizedString from free text.
 * Preserves any already-filled locales in `existing`.
 */
export async function autoLocalizeText(
  text: string,
  sourceLocale: Locale = "fr",
  existing?: MaybeLocalized
): Promise<LocalizedString> {
  const base = liftToLocalized(existing);
  const source =
    text.trim() ||
    getL(base, sourceLocale) ||
    getL(base, "fr") ||
    getL(base);
  if (!source) return base;

  // 1) Dictionary — full 4-locale set (authoritative for known phrases)
  const dict = lookupDictionary(source);
  if (dict) {
    return { ...dict };
  }

  // 2) Start from source in source locale
  const out: LocalizedString = {
    ...base,
    [sourceLocale]: base[sourceLocale] || source,
  };

  // Ensure source locale has text
  if (!out[sourceLocale]?.trim()) out[sourceLocale] = source;

  // 3) API for missing locales (parallel)
  const missing = LOCALES.filter((loc) => !out[loc]?.trim());
  if (missing.length === 0) return out;

  const from = (LOCALES.find((loc) => out[loc]?.trim()) || sourceLocale) as Locale;
  const fromText = out[from]!.trim();

  await Promise.all(
    missing.map(async (to) => {
      const translated = await translateOne(fromText, from, to);
      out[to] = translated || fromText;
    })
  );

  return out;
}

/**
 * Fill missing locales on an existing LocalizedString.
 * Dictionary phrases always expand to all 4 locales.
 * Otherwise translates only empty slots (keeps distinct user edits).
 */
export async function fillMissingLocales(
  value: MaybeLocalized,
  preferredSource: Locale = "fr"
): Promise<LocalizedString> {
  const base = liftToLocalized(value);
  const source =
    getL(base, preferredSource) ||
    getL(base, "fr") ||
    getL(base);
  if (!source) return base;

  // Known phrase → always full set (fixes FR-only or untranslated copies)
  const dict = lookupDictionary(source);
  if (dict) return { ...dict };

  // If all filled with the *same* source text, re-translate non-source locales
  const allFilled = LOCALES.every((loc) => base[loc]?.trim());
  if (allFilled) {
    const srcNorm = normLoose(source);
    const allSame = LOCALES.every(
      (loc) => normLoose(base[loc] || "") === srcNorm
    );
    if (!allSame) return base;
    // All locales identical → treat as untranslated copies
    return autoLocalizeText(source, preferredSource, {
      [preferredSource]: source,
    });
  }

  return autoLocalizeText(source, preferredSource, base);
}

/**
 * Ensure language name + level are fully localized (dictionary + API).
 * Returns null if nothing changed.
 */
export async function ensureLanguageLocales(languages: {
  id: string;
  name: MaybeLocalized;
  level: MaybeLocalized;
}[]): Promise<
  | { id: string; name: LocalizedString; level: LocalizedString }[]
  | null
> {
  let changed = false;
  const next = await Promise.all(
    languages.map(async (lang) => {
      const name = await fillMissingLocales(lang.name, "fr");
      const level = await fillMissingLocales(lang.level, "fr");
      const nameBefore = JSON.stringify(liftToLocalized(lang.name));
      const levelBefore = JSON.stringify(liftToLocalized(lang.level));
      if (
        JSON.stringify(name) !== nameBefore ||
        JSON.stringify(level) !== levelBefore
      ) {
        changed = true;
      }
      return { id: lang.id, name, level };
    })
  );
  return changed ? next : null;
}

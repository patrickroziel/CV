import type { Locale } from "@/i18n/locales";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";

/**
 * Text content per locale. After migration, flat strings become `{ fr: "…" }`.
 * Missing locales fall back to FR then any available value.
 */
export type LocalizedString = {
  fr?: string;
  en?: string;
  pl?: string;
  es?: string;
};

/** Accept legacy flat strings during migration / partial updates */
export type MaybeLocalized = string | LocalizedString | null | undefined;

/** Build a LocalizedString from FR (+ optional other locales) */
export function L(
  fr: string,
  extras?: Partial<Record<Exclude<Locale, "fr">, string>>
): LocalizedString {
  const out: LocalizedString = {};
  if (fr) out.fr = fr;
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) out[k as Locale] = v;
    }
  }
  return out;
}

/**
 * Merge missing locale keys from `seed` into `current` without overwriting
 * existing non-empty translations (user edits win).
 */
export function mergeMissingLocales(
  current: MaybeLocalized,
  seed: MaybeLocalized
): LocalizedString {
  const base = liftToLocalized(current);
  const from = liftToLocalized(seed);
  const out: LocalizedString = { ...base };
  for (const loc of LOCALES) {
    if (!out[loc] && from[loc]) out[loc] = from[loc];
  }
  return out;
}

/** Lift a legacy string (or partial object) into LocalizedString */
export function liftToLocalized(value: MaybeLocalized): LocalizedString {
  if (value == null) return {};
  if (typeof value === "string") {
    return value.trim() ? { fr: value } : {};
  }
  if (typeof value === "object") {
    const out: LocalizedString = {};
    for (const loc of LOCALES) {
      const v = value[loc];
      if (typeof v === "string" && v.length > 0) out[loc] = v;
    }
    return out;
  }
  return {};
}

/**
 * Resolve display text for a locale with fallback chain:
 * locale → fr → first non-empty → ""
 */
export function getL(
  value: MaybeLocalized,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;

  const direct = value[locale];
  if (typeof direct === "string" && direct.trim()) return direct;

  const fr = value.fr;
  if (typeof fr === "string" && fr.trim()) return fr;

  for (const loc of LOCALES) {
    const v = value[loc];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/** Set one locale entry without wiping others */
export function setL(
  current: MaybeLocalized,
  locale: Locale,
  text: string
): LocalizedString {
  const base = liftToLocalized(current);
  if (!text.trim()) {
    const next = { ...base };
    delete next[locale];
    return next;
  }
  return { ...base, [locale]: text };
}

export function isLocaleFilled(
  value: MaybeLocalized,
  locale: Locale
): boolean {
  if (value == null) return false;
  if (typeof value === "string") return locale === "fr" && value.trim().length > 0;
  const v = value[locale];
  return typeof v === "string" && v.trim().length > 0;
}

/** All non-empty locale values of a localized field (for skill matching) */
export function allLocalizedValues(value: MaybeLocalized): string[] {
  if (value == null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  const out: string[] = [];
  for (const loc of LOCALES) {
    const v = value[loc];
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  }
  return out;
}

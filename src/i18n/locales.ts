export type Locale = "fr" | "en" | "pl" | "es";

export const LOCALES: Locale[] = ["fr", "en", "pl", "es"];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_META: Record<
  Locale,
  { flag: string; nativeName: string; short: string }
> = {
  fr: { flag: "🇫🇷", nativeName: "Français", short: "FR" },
  en: { flag: "🇬🇧", nativeName: "English", short: "EN" },
  pl: { flag: "🇵🇱", nativeName: "Polski", short: "PL" },
  es: { flag: "🇪🇸", nativeName: "Español", short: "ES" },
};

export const LOCALE_STORAGE_KEY = "mon-portfolio-v2-locale";

export function isLocale(v: unknown): v is Locale {
  return v === "fr" || v === "en" || v === "pl" || v === "es";
}

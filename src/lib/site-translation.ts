export type SiteLanguage = {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
};

/**
 * Public translation choices.
 * The source site remains French; all other choices are generated on demand
 * and are never written into portfolio content.
 *
 * English and Arabic each keep a single variant: the most common one.
 */
export const SITE_LANGUAGES: SiteLanguage[] = [
  { code: "fr", label: "Français", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "pl", label: "Polonais", nativeLabel: "Polski", flag: "🇵🇱" },
  { code: "en-US", label: "Anglais", nativeLabel: "English", flag: "🇺🇸" },
  { code: "es", label: "Espagnol", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "tr", label: "Turc", nativeLabel: "Türkçe", flag: "🇹🇷" },
  { code: "vi", label: "Vietnamien", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ar-maghreb", label: "Arabe", nativeLabel: "العربية المغاربية", flag: "🌍" },
  { code: "ru", label: "Russe", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "el", label: "Grec", nativeLabel: "Ελληνικά", flag: "🇬🇷" },
  { code: "zh-CN", label: "Chinois simplifié", nativeLabel: "简体中文", flag: "🇨🇳" },
  { code: "ja", label: "Japonais", nativeLabel: "日本語", flag: "🇯🇵" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇮🇳" },
  { code: "ta", label: "Tamoul", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "pa", label: "Pendjabi", nativeLabel: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ne", label: "Népalais", nativeLabel: "नेपाली", flag: "🇳🇵" },
  { code: "sa", label: "Sanskrit", nativeLabel: "संस्कृतम्", flag: "🇮🇳" },
  { code: "ha", label: "Haoussa (Niger)", nativeLabel: "Hausa", flag: "🇳🇪" },
  { code: "pt-PT", label: "Portugais", nativeLabel: "Português", flag: "🇵🇹" },
];

export const SITE_LANGUAGE_CODES = new Set(SITE_LANGUAGES.map((language) => language.code));
export const DEFAULT_SITE_LANGUAGE = "fr";
export const SITE_LANGUAGE_STORAGE_KEY = "patrick-site-language";

export function getSiteLanguage(code: string | null | undefined): SiteLanguage {
  return SITE_LANGUAGES.find((language) => language.code === code) ?? SITE_LANGUAGES[0];
}

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
 * The first five choices are intentionally ordered by Patrick's preference:
 * French, Polish, British English, American English, then Spanish.
 */
export const SITE_LANGUAGES: SiteLanguage[] = [
  { code: "fr", label: "Français", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "pl", label: "Polonais", nativeLabel: "Polski", flag: "🇵🇱" },
  { code: "en-GB", label: "Anglais britannique", nativeLabel: "British English", flag: "🇬🇧" },
  { code: "en-US", label: "Anglais américain", nativeLabel: "American English", flag: "🇺🇸" },
  { code: "es", label: "Espagnol", nativeLabel: "Español", flag: "🇪🇸" },

  { code: "gcf-antilles", label: "Créole antillais", nativeLabel: "Kréyòl Gwadloup / Matinik", flag: "🇬🇵🇲🇶" },
  { code: "ht", label: "Créole haïtien", nativeLabel: "Kreyòl ayisyen", flag: "🇭🇹" },

  { code: "nouchi-ci", label: "Ivoirien (Nouchi)", nativeLabel: "Nouchi", flag: "🇨🇮" },
  { code: "bm", label: "Bambara", nativeLabel: "Bamanankan", flag: "🇲🇱" },
  { code: "snk-soninke", label: "Soninké", nativeLabel: "Sooninkanxanne", flag: "🇲🇱" },
  { code: "ln", label: "Congolais (Lingala)", nativeLabel: "Lingála", flag: "🇨🇩🇨🇬" },
  { code: "tr", label: "Turc", nativeLabel: "Türkçe", flag: "🇹🇷" },
  { code: "vi", label: "Vietnamien", nativeLabel: "Tiếng Việt", flag: "🇻🇳" },

  { code: "ar-msa", label: "Arabe littéraire", nativeLabel: "العربية الفصحى", flag: "🌍" },
  { code: "ar-maghreb", label: "Arabe maghrébin", nativeLabel: "العربية المغاربية", flag: "🌍" },
  { code: "ar-egypt", label: "Arabe égyptien", nativeLabel: "العربية المصرية", flag: "🇪🇬" },

  { code: "ru", label: "Russe", nativeLabel: "Русский", flag: "🇷🇺" },
  { code: "el", label: "Grec", nativeLabel: "Ελληνικά", flag: "🇬🇷" },
  { code: "zh-CN", label: "Chinois simplifié", nativeLabel: "简体中文", flag: "🇨🇳" },
  { code: "ja", label: "Japonais", nativeLabel: "日本語", flag: "🇯🇵" },
  { code: "ha", label: "Haoussa (Niger)", nativeLabel: "Hausa", flag: "🇳🇪" },
  { code: "pt-PT", label: "Portugais", nativeLabel: "Português", flag: "🇵🇹" },
];

export const SITE_LANGUAGE_CODES = new Set(SITE_LANGUAGES.map((language) => language.code));
export const DEFAULT_SITE_LANGUAGE = "fr";
export const SITE_LANGUAGE_STORAGE_KEY = "patrick-site-language";

export function getSiteLanguage(code: string | null | undefined): SiteLanguage {
  return SITE_LANGUAGES.find((language) => language.code === code) ?? SITE_LANGUAGES[0];
}

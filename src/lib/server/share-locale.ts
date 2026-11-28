import "server-only";

import { shareLanguageFromParam } from "@/lib/site-translation";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const OPEN_GRAPH_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  pl: "pl_PL",
  "en-GB": "en_GB",
  "en-US": "en_US",
  es: "es_ES",
  ht: "ht_HT",
  tr: "tr_TR",
  vi: "vi_VN",
  ru: "ru_RU",
  el: "el_GR",
  "zh-CN": "zh_CN",
  ja: "ja_JP",
  "pt-PT": "pt_PT",
  bm: "bm_ML",
  ln: "ln_CD",
  ha: "ha_NG",
};

export function requestedShareLanguage(value: string | string[] | undefined | null) {
  const lang = Array.isArray(value) ? value[0] : value;
  return shareLanguageFromParam(lang);
}

export function openGraphLocale(lang: string | null) {
  return OPEN_GRAPH_LOCALES[lang ?? "fr"] ?? "fr_FR";
}

export function shareImageUrl(id: string, lang: string | null, cover?: string | null) {
  const url = new URL(`${NOTES_ORIGIN}/api/notes/${encodeURIComponent(id)}/share-image`);
  url.searchParams.set("v", "14");
  if (lang) url.searchParams.set("lang", lang);
  if (cover) {
    let hash = 0;
    for (const char of cover) hash = (Math.imul(hash, 33) + char.charCodeAt(0)) >>> 0;
    url.searchParams.set("c", hash.toString(36));
  }
  return url.toString();
}

/** Server-side copy of the on-site Google translation, for link previews only. */
export async function translateShareText(title: string, description: string, lang: string | null, full = false) {
  if (!lang) return { title, description };
  try {
    const response = await fetch(`${NOTES_ORIGIN}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [title, description], target: lang }),
      cache: "force-cache",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return { title, description };
    const payload = (await response.json()) as { translations?: string[] };
    const nextTitle = payload.translations?.[0]?.replace(/\s+/g, " ").trim();
    const nextDescription = payload.translations?.[1]?.replace(/\s+/g, " ").trim();
    const resolvedTitle = nextTitle || title;
    const resolvedDescription = nextDescription || description;
    return {
      title: full ? resolvedTitle : resolvedTitle.slice(0, 130),
      description: full ? resolvedDescription : resolvedDescription.slice(0, 200),
    };
  } catch {
    return { title, description };
  }
}

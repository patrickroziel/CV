import type { Locale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";
import { fr, type MessageTree } from "./messages/fr";
import { en } from "./messages/en";
import { pl } from "./messages/pl";
import { es } from "./messages/es";

const catalogs: Record<Locale, MessageTree> = { fr, en, pl, es };

export type { MessageTree };
export type MessageKey = string;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

/** Translate a dotted UI key, e.g. `nav.home` */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  const primary = getByPath(catalogs[locale], key);
  if (primary) return primary;
  if (locale !== "fr") {
    const fallback = getByPath(catalogs.fr, key);
    if (fallback) return fallback;
  }
  return key;
}

export function getMessages(locale: Locale): MessageTree {
  return catalogs[locale] ?? catalogs.fr;
}

export * from "./locales";

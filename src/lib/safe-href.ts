/** Public http(s), mailto, tel, or same-site path. Rejects scripts and credentials. */
export function safeHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    if (/[\s<>"']/.test(trimmed)) return null;
    return trimmed;
  }
  let value = trimmed;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (/^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(value)) value = `https://${value}`;
    else return null;
  }
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    if (url.protocol === "mailto:" || url.protocol === "tel:") return url.toString();
    return null;
  } catch {
    return null;
  }
}

export function safeImageSrc(raw: string): string | null {
  const href = safeHref(raw);
  if (!href || !/^https:\/\//i.test(href)) return null;
  return href;
}

export function hostLabel(href: string): string {
  try {
    const url = new URL(href);
    if (url.protocol === "mailto:") return url.pathname;
    return url.host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

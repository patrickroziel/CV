/**
 * Line-height for rich text blocks (whole description).
 * Stored as data-rich-lh on an outer wrapper div.
 * Legacy class markers (compact / normal / airy) are mapped on read.
 */

export const DEFAULT_LINE_HEIGHT = 1.25;
export const MIN_LINE_HEIGHT = 1;
export const MAX_LINE_HEIGHT = 2.5;
export const LINE_HEIGHT_STEP = 0.05;

const LEGACY_MAP: Record<string, number> = {
  compact: 1.25,
  normal: 1.5,
  airy: 1.75,
};

const LH_ATTR = "data-rich-lh";

export function clampLineHeight(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LINE_HEIGHT;
  const rounded = Math.round(n * 100) / 100;
  return Math.min(MAX_LINE_HEIGHT, Math.max(MIN_LINE_HEIGHT, rounded));
}

export function formatLineHeight(n: number): string {
  const v = clampLineHeight(n);
  // Prefer compact display: 1.25 not 1.250
  return String(parseFloat(v.toFixed(2)));
}

export function parseLineHeightInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return clampLineHeight(n);
}

function parseLhToken(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(String(value).trim().replace(",", "."));
  if (Number.isFinite(n) && n >= MIN_LINE_HEIGHT && n <= MAX_LINE_HEIGHT) {
    return clampLineHeight(n);
  }
  return null;
}

/** @deprecated kept for type compatibility during transition */
export type RichSpacing = "compact" | "normal" | "airy";
export const DEFAULT_RICH_SPACING: RichSpacing = "compact";

/**
 * Read line-height from stored HTML and return body without the marker wrapper.
 * Defaults to 1.25. Understands legacy rich-spacing-* classes.
 */
export function extractRichSpacing(html: string): {
  lineHeight: number;
  /** @deprecated use lineHeight */
  spacing: RichSpacing;
  body: string;
} {
  const fallback = {
    lineHeight: DEFAULT_LINE_HEIGHT,
    spacing: "compact" as RichSpacing,
    body: html || "",
  };
  if (!html?.trim()) {
    return { lineHeight: DEFAULT_LINE_HEIGHT, spacing: "compact", body: "" };
  }

  if (typeof document !== "undefined") {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const first = template.content.firstElementChild as HTMLElement | null;
    if (
      first &&
      first.tagName === "DIV" &&
      template.content.childNodes.length === 1
    ) {
      const fromAttr = parseLhToken(first.getAttribute(LH_ATTR));
      if (fromAttr != null) {
        return {
          lineHeight: fromAttr,
          spacing: lhToLegacy(fromAttr),
          body: first.innerHTML,
        };
      }
      // Outer marker with only style line-height + rich-lh class
      const isLhWrapper =
        first.classList.contains("rich-lh") ||
        /\brich-spacing-/.test(first.className) ||
        first.hasAttribute(LH_ATTR);
      const styleLh = parseLhFromCssText(first.getAttribute("style"));
      if (isLhWrapper && styleLh != null) {
        return {
          lineHeight: styleLh,
          spacing: lhToLegacy(styleLh),
          body: first.innerHTML,
        };
      }
      const tokens = (first.getAttribute("class") || "")
        .split(/\s+/)
        .filter(Boolean);
      for (const t of tokens) {
        const m = t.match(/^rich-spacing-(compact|normal|airy)$/);
        if (m && LEGACY_MAP[m[1]] != null) {
          const lineHeight = LEGACY_MAP[m[1]];
          return {
            lineHeight,
            spacing: m[1] as RichSpacing,
            body: first.innerHTML,
          };
        }
        const m2 = t.match(/^rich-lh-(\d+)(?:-(\d+))?$/);
        if (m2) {
          const whole = m2[1];
          const frac = m2[2] ?? "0";
          const lineHeight = clampLineHeight(
            Number(`${whole}.${frac.padEnd(2, "0").slice(0, 2)}`)
          );
          return {
            lineHeight,
            spacing: lhToLegacy(lineHeight),
            body: first.innerHTML,
          };
        }
      }
    }
    return fallback;
  }

  // SSR
  const attrM = html
    .trim()
    .match(
      /^<div\b[^>]*\bdata-rich-lh=["']([\d.]+)["'][^>]*>([\s\S]*)<\/div>\s*$/i
    );
  if (attrM) {
    const lineHeight = clampLineHeight(Number(attrM[1]));
    return {
      lineHeight,
      spacing: lhToLegacy(lineHeight),
      body: attrM[2],
    };
  }
  const legacyM = html
    .trim()
    .match(
      /^<div\s+class=["'](?:[^"']*\s)?rich-spacing-(compact|normal|airy)(?:\s[^"']*)?["']\s*>([\s\S]*)<\/div>\s*$/i
    );
  if (legacyM && LEGACY_MAP[legacyM[1]] != null) {
    return {
      lineHeight: LEGACY_MAP[legacyM[1]],
      spacing: legacyM[1] as RichSpacing,
      body: legacyM[2],
    };
  }
  return fallback;
}

function parseLhFromCssText(style: string | null): number | null {
  if (!style) return null;
  const m = style.match(/line-height\s*:\s*([\d.]+)/i);
  if (!m) return null;
  return parseLhToken(m[1]);
}

function lhToLegacy(lh: number): RichSpacing {
  if (lh <= 1.35) return "compact";
  if (lh <= 1.6) return "normal";
  return "airy";
}

/** True if class token is a legacy density marker (for sanitize allowlist) */
export function isRichSpacingClass(token: string): boolean {
  return (
    /^rich-spacing-(compact|normal|airy)$/.test(token) ||
    /^rich-lh-\d+(-\d+)?$/.test(token)
  );
}

export function spacingClass(_spacing: RichSpacing | number): string {
  // Class kept for backwards CSS hooks; actual value is inline line-height
  return "rich-lh";
}

/** Wrap sanitized body with line-height marker (single outer wrapper). */
export function wrapWithRichSpacing(
  bodyHtml: string,
  lineHeight: number | RichSpacing = DEFAULT_LINE_HEIGHT
): string {
  const { body } = extractRichSpacing(bodyHtml);
  const inner = body || bodyHtml || "";
  if (!inner.trim()) return "";
  const lh =
    typeof lineHeight === "number"
      ? clampLineHeight(lineHeight)
      : LEGACY_MAP[lineHeight] ?? DEFAULT_LINE_HEIGHT;
  const v = formatLineHeight(lh);
  return `<div ${LH_ATTR}="${v}" class="rich-lh" style="line-height: ${v}">${inner}</div>`;
}

export function stepLineHeight(current: number, dir: 1 | -1): number {
  return clampLineHeight(current + dir * LINE_HEIGHT_STEP);
}

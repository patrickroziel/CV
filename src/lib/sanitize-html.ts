import {
  extractRichSpacing,
  isRichSpacingClass,
} from "@/lib/rich-spacing";
import { normalizeRichBody, restoreColorMarkers } from "@/lib/rich-format";

export type SanitizeHtmlOptions = {
  /**
   * Paste from Word / Notes / browser: drop external colors & sizes so text
   * uses the site theme. Manual toolbar color/size still allowed on commit
   * (fromPaste: false / omitted).
   */
  fromPaste?: boolean;
};

/**
 * Allow a small HTML subset for rich text fields:
 * b, strong, i, em, u, br, p, div, span, ul, ol, li
 * style: font-weight, font-style, text-align
 *        + color / font-size only when NOT from paste (manual edit)
 * Never keeps font-family — site default font always wins.
 */
export function sanitizeBioHtml(
  input: string,
  options: SanitizeHtmlOptions = {}
): string {
  if (!input) return "";
  if (typeof document === "undefined") {
    // SSR / Node: strip tags that are clearly dangerous; full sanitize on client
    return input
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "");
  }

  const fromPaste = Boolean(options.fromPaste);
  const template = document.createElement("template");
  template.innerHTML = input;
  const allowed = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "BR",
    "P",
    "SPAN",
    "DIV",
    "FONT", // legacy from execCommand foreColor / fontSize
    "U",
    "UL",
    "OL",
    "LI",
  ]);
  // Never font-family. Color/size only for manual editor commits.
  // line-height only when not paste (wrapper + editor) — Word line-heights stripped on paste.
  const styleProps = new Set([
    "font-weight",
    "font-style",
    "text-align",
    ...(fromPaste ? [] : ["color", "font-size", "line-height"]),
  ]);

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }
      const el = child as HTMLElement;

      // Normalize <font> from execCommand into <span style="...">
      // Never apply face/font-family. Skip color/size when fromPaste.
      if (el.tagName === "FONT") {
        const span = document.createElement("span");
        const color = el.getAttribute("color");
        const size = el.getAttribute("size");
        const styles: string[] = [];
        if (color && !fromPaste) styles.push(`color: ${color}`);
        if (size && !fromPaste) {
          // HTML font size 1–7 → approx rem
          const map: Record<string, string> = {
            "1": "0.75rem",
            "2": "0.875rem",
            "3": "1rem",
            "4": "1.125rem",
            "5": "1.35rem",
            "6": "1.6rem",
            "7": "2rem",
          };
          styles.push(`font-size: ${map[size] || "1rem"}`);
        }
        if (styles.length) span.setAttribute("style", styles.join("; "));
        while (el.firstChild) span.appendChild(el.firstChild);
        el.parentNode?.replaceChild(span, el);
        walk(span);
        continue;
      }

      if (!allowed.has(el.tagName)) {
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.parentNode?.removeChild(el);
        continue;
      }

      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (name === "style") {
          const cleaned: string[] = [];
          for (const part of el.style.cssText.split(";")) {
            const [rawKey, ...rest] = part.split(":");
            if (!rawKey || rest.length === 0) continue;
            const key = rawKey.trim().toLowerCase();
            const val = rest.join(":").trim();
            if (!styleProps.has(key) || !val) continue;
            if (/url\s*\(|expression\s*\(|javascript:/i.test(val)) continue;
            cleaned.push(`${key}: ${val}`);
          }
          if (cleaned.length) el.setAttribute("style", cleaned.join("; "));
          else el.removeAttribute("style");
        } else if (name === "class") {
          // Only density / line-height markers — never external font classes
          const kept = attr.value
            .split(/\s+/)
            .filter(
              (t) =>
                isRichSpacingClass(t) || t === "rich-lh"
            );
          if (kept.length) el.setAttribute("class", kept.join(" "));
          else el.removeAttribute("class");
        } else if (name === "data-rich-lh") {
          // Numeric interligne marker on the outer wrapper
          const n = Number(String(attr.value).replace(",", "."));
          if (Number.isFinite(n) && n >= 1 && n <= 2.5) {
            el.setAttribute("data-rich-lh", String(Math.round(n * 100) / 100));
          } else {
            el.removeAttribute("data-rich-lh");
          }
        } else if (name === "data-rich-color") {
          // Intentional colour from the editor toolbar — always keep
          const c = attr.value?.trim();
          if (c && !fromPaste) {
            el.setAttribute("data-rich-color", c);
            // Mirror onto style so public render never loses it
            if (!el.style.color) el.style.color = c;
          } else if (fromPaste) {
            el.removeAttribute("data-rich-color");
          }
        } else if (name === "color" && !fromPaste && el.tagName === "FONT") {
          // handled above when converting FONT
          el.removeAttribute(attr.name);
        } else {
          // Drop face, color, size attrs, other data-*, etc.
          el.removeAttribute(attr.name);
        }
      }
      // If we kept data-rich-color, ensure style.color exists after style cleanup
      const marker = el.getAttribute("data-rich-color");
      if (marker && !fromPaste) {
        el.style.color = marker;
      }
      walk(el);
    }
  };

  walk(template.content);
  // Final pass: re-sync colour markers ↔ style
  return fromPaste
    ? template.innerHTML
    : restoreColorMarkers(template.innerHTML);
}

/** True if the string looks like HTML markup (not plain text) */
export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/**
 * Prepare stored content for a contentEditable surface.
 * Plain text with newlines / list markers becomes structured HTML so
 * legacy fields keep their layout when opened in the rich editor.
 */
export function toEditableHtml(value: string): string {
  if (!value) return "";
  if (looksLikeHtml(value)) {
    // Line-height wrapper lives on the editor chrome / public container, not inside body
    const { body } = extractRichSpacing(value);
    // Normalize to a single homogeneous tree, then sanitize (keeps colours)
    const flat = normalizeRichBody(body || value);
    return sanitizeBioHtml(flat);
  }
  // Defer plain→HTML conversion to clipboard helper only when structure is present
  if (/[\n\r]/.test(value) || /^\s*(?:[•●○▪\-–—*]|(\d+[\.\)]))\s+/m.test(value)) {
    // Lazy import avoided: simple conversion here keeps sanitize-html free of clipboard deps
    return value
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split(/\n{2,}/)
      .map((block) => {
        const lines = block.split("\n");
        const isList = lines.every(
          (ln) =>
            !ln.trim() ||
            /^\s*(?:[•●○▪\-–—*]|(\d+[\.\)]))\s+/.test(ln)
        );
        if (isList && lines.some((ln) => ln.trim())) {
          const ordered = lines.some((ln) => /^\s*\d+[\.\)]\s+/.test(ln));
          const tag = ordered ? "ol" : "ul";
          const items = lines
            .filter((ln) => ln.trim())
            .map((ln) => {
              const body = ln
                .replace(
                  /^\s*(?:[•●○▪\-–—*]|(\d+[\.\)]))\s+/,
                  ""
                )
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              return `<li>${body}</li>`;
            })
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        const inner = lines
          .map((ln) =>
            ln
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
          )
          .join("<br>");
        return `<p>${inner}</p>`;
      })
      .join("");
  }
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Strip tags for plain-text contexts (CV print, aria, filenames, etc.) */
export function stripHtml(input: string): string {
  if (!input) return "";
  if (typeof document === "undefined") {
    return input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&#(?:160|xA0);/gi, " ")
      .replace(/\u00a0/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = sanitizeBioHtml(input);
  div.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  div.querySelectorAll("li").forEach((li) => {
    li.prepend("• ");
    li.append("\n");
  });
  div.querySelectorAll("p, div").forEach((block) => {
    block.append("\n");
  });
  return (div.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

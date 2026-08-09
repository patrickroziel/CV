/**
 * Smart clipboard paste for portfolio edit fields.
 * Preserves structure (paragraphs, lists, bold/italic), accepts emojis,
 * and maps common broken / shortcode forms to usable Unicode emojis.
 */

import type { ClipboardEvent as ReactClipboardEvent } from "react";
import { sanitizeBioHtml } from "@/lib/sanitize-html";

/** Common shortcodes → emoji */
const SHORTCODE_MAP: Record<string, string> = {
  smile: "😄",
  smiling: "😊",
  grin: "😁",
  joy: "😂",
  rofl: "🤣",
  wink: "😉",
  blush: "😊",
  heart_eyes: "😍",
  heart: "❤️",
  hearts: "💕",
  fire: "🔥",
  star: "⭐",
  sparkles: "✨",
  check: "✅",
  white_check_mark: "✅",
  x: "❌",
  heavy_check_mark: "✔️",
  thumbsup: "👍",
  "+1": "👍",
  thumbsdown: "👎",
  "-1": "👎",
  clap: "👏",
  wave: "👋",
  pray: "🙏",
  muscle: "💪",
  eyes: "👀",
  thinking: "🤔",
  thinking_face: "🤔",
  rocket: "🚀",
  tada: "🎉",
  party: "🎉",
  100: "💯",
  bulb: "💡",
  idea: "💡",
  warning: "⚠️",
  info: "ℹ️",
  camera: "📷",
  movie_camera: "🎥",
  film_projector: "📽️",
  clapper: "🎬",
  video_camera: "📹",
  microphone: "🎤",
  headphones: "🎧",
  musical_note: "🎵",
  laptop: "💻",
  computer: "💻",
  phone: "📱",
  email: "📧",
  envelope: "✉️",
  link: "🔗",
  globe: "🌍",
  earth_africa: "🌍",
  earth_americas: "🌎",
  earth_asia: "🌏",
  fr: "🇫🇷",
  flag_fr: "🇫🇷",
  us: "🇺🇸",
  flag_us: "🇺🇸",
  gb: "🇬🇧",
  flag_gb: "🇬🇧",
  pl: "🇵🇱",
  flag_pl: "🇵🇱",
  es: "🇪🇸",
  flag_es: "🇪🇸",
  pencil: "✏️",
  memo: "📝",
  book: "📖",
  books: "📚",
  briefcase: "💼",
  trophy: "🏆",
  medal: "🏅",
  art: "🎨",
  paintbrush: "🖌️",
  wrench: "🔧",
  gear: "⚙️",
  zap: "⚡",
  sunny: "☀️",
  cloud: "☁️",
  rainbow: "🌈",
  coffee: "☕",
  pizza: "🍕",
  beer: "🍺",
  wine_glass: "🍷",
  point_right: "👉",
  point_left: "👈",
  point_up: "👆",
  point_down: "👇",
  ok_hand: "👌",
  v: "✌️",
  raised_hands: "🙌",
  handshake: "🤝",
  brain: "🧠",
  speech_balloon: "💬",
  megaphone: "📢",
  pushpin: "📌",
  paperclip: "📎",
  folder: "📁",
  chart_with_upwards_trend: "📈",
  chart: "📊",
  calendar: "📅",
  clock: "🕐",
  hourglass: "⌛",
  lock: "🔒",
  key: "🔑",
  mag: "🔍",
  gift: "🎁",
  balloon: "🎈",
  confetti_ball: "🎊",
  boom: "💥",
  sweat_smile: "😅",
  slightly_smiling_face: "🙂",
  upside_down_face: "🙃",
  innocent: "😇",
  sunglasses: "😎",
  nerd_face: "🤓",
  confused: "😕",
  worried: "😟",
  cry: "😢",
  sob: "😭",
  angry: "😠",
  rage: "😡",
  sleepy: "😪",
  yawn: "🥱",
  zzz: "💤",
  skull: "💀",
  poop: "💩",
  ghost: "👻",
  alien: "👽",
  robot: "🤖",
  cat: "🐱",
  dog: "🐶",
  unicorn: "🦄",
  dragon: "🐉",
  sun: "☀️",
  moon: "🌙",
  stars: "✨",
  high_voltage: "⚡",
  collison: "💥",
  collision: "💥",
};

/**
 * Broken / legacy glyph → modern emoji (or closest common alternative).
 * Covers replacement chars, dingbats, and often-misread symbols.
 */
const GLYPH_MAP: Record<string, string> = {
  "\uFFFD": "✨", // replacement character
  "\u25A1": "⬜", // white square
  "\u25A0": "⬛",
  "\u25CB": "⚪",
  "\u25CF": "⚫",
  "\u2605": "⭐",
  "\u2606": "☆",
  "\u2665": "❤️",
  "\u2661": "♡",
  "\u2713": "✅",
  "\u2714": "✅",
  "\u2717": "❌",
  "\u2718": "❌",
  "\u2610": "☐",
  "\u2611": "☑️",
  "\u2612": "☒",
  "\u263A": "☺️",
  "\u2639": "☹️",
  "\u2705": "✅",
  "\u274C": "❌",
  "\u2B50": "⭐",
  "\u2764": "❤️",
  "\uFE0E": "", // text variation selector alone — drop
};

const BULLET_LINE =
  /^\s*(?:[•●○▪▫■□◆◇►▸‣⁃·∙]|[-–—*✗✘]|→|=>|\(\s*[•*xX]\s*\))\s+/;
const NUMBERED_LINE = /^\s*(?:\d+[\.\)]\s+|[a-zA-Z][\.\)]\s+|\(\d+\)\s+)/;

export type PasteMode = "rich" | "plain" | "singleLine";

export type ConvertPasteOptions = {
  mode?: PasteMode;
};

/** Normalize shortcodes and broken glyphs to usable emojis */
export function normalizeEmojis(input: string): string {
  if (!input) return "";
  let s = input;

  // :shortcode: → emoji
  s = s.replace(/:([a-zA-Z0-9_+-]+):/g, (full, code: string) => {
    const key = code.toLowerCase();
    return SHORTCODE_MAP[key] ?? SHORTCODE_MAP[key.replace(/-/g, "_")] ?? full;
  });

  // Broken / legacy glyphs
  for (const [from, to] of Object.entries(GLYPH_MAP)) {
    if (from && s.includes(from)) s = s.split(from).join(to);
  }

  // Soft hyphen / zero-width junk that breaks emoji clusters (keep ZWJ U+200D)
  s = s.replace(/[\u00AD\u200B\u200C\u2060\uFEFF]/g, "");

  // Orphan high/low surrogates → sparkles fallback (no lookbehind for broader engines)
  s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "✨");
  s = s.replace(
    /([^\uD800-\uDBFF]|^)([\uDC00-\uDFFF])/g,
    (_m, pre: string) => `${pre}✨`
  );

  return s;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Lightweight markdown inline → HTML (after escape) */
function inlineMarkdownToHtml(escaped: string): string {
  let s = escaped;
  // **bold** or __bold__ first
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // *italic* — single asterisks only (not part of **)
  s = s.replace(
    /(^|[^*])\*([^*\n]+?)\*([^*]|$)/g,
    "$1<em>$2</em>$3"
  );
  // _italic_
  s = s.replace(
    /(^|[^_])_([^_\n]+?)_([^_]|$)/g,
    "$1<em>$2</em>$3"
  );
  // `code` → plain (no code tag in allowlist)
  s = s.replace(/`([^`]+)`/g, "$1");
  return s;
}

function lineKind(
  line: string
): "empty" | "ul" | "ol" | "text" {
  if (!line.trim()) return "empty";
  if (BULLET_LINE.test(line)) return "ul";
  if (NUMBERED_LINE.test(line)) return "ol";
  return "text";
}

function stripListMarker(line: string, kind: "ul" | "ol"): string {
  if (kind === "ul") return line.replace(BULLET_LINE, "");
  return line.replace(NUMBERED_LINE, "");
}

/**
 * Convert plain text (notes, ChatGPT, Word plain) into structured HTML.
 * Detects bullet/numbered runs and paragraphs.
 */
export function plainTextToHtml(raw: string): string {
  const text = normalizeEmojis(raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
  if (!text.trim()) return "";

  const lines = text.split("\n");
  const parts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const kind = lineKind(lines[i]);

    if (kind === "empty") {
      i += 1;
      continue;
    }

    if (kind === "ul" || kind === "ol") {
      const tag = kind;
      const items: string[] = [];
      while (i < lines.length && lineKind(lines[i]) === kind) {
        const body = stripListMarker(lines[i], kind);
        items.push(
          `<li>${inlineMarkdownToHtml(escapeHtml(body.trim()))}</li>`
        );
        i += 1;
      }
      parts.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    // Paragraph: gather consecutive text lines (single \n → <br>)
    const paraLines: string[] = [];
    while (i < lines.length && lineKind(lines[i]) === "text") {
      paraLines.push(lines[i]);
      i += 1;
    }
    const inner = paraLines
      .map((ln) => inlineMarkdownToHtml(escapeHtml(ln.trimEnd())))
      .join("<br>");
    parts.push(`<p>${inner}</p>`);
  }

  return parts.join("") || `<p>${inlineMarkdownToHtml(escapeHtml(text))}</p>`;
}

/**
 * Clean Word / Google Docs / browser HTML into our allowed subset,
 * fixing list-ish markup and emojis in text nodes.
 */
export function cleanPastedHtml(rawHtml: string): string {
  if (typeof document === "undefined") {
    return plainTextToHtml(
      rawHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
    );
  }

  const template = document.createElement("template");
  // Strip Word conditional comments & XML namespaces noise
  const cleaned = rawHtml
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "")
    .replace(/<\/?o:[^>]*>/gi, "")
    .replace(/<\/?w:[^>]*>/gi, "")
    .replace(/<\/?m:[^>]*>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<link[^>]*>/gi, "");

  template.innerHTML = cleaned;

  const walkText = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = normalizeEmojis(node.textContent || "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;

    // Strip external presentation before sanitize: fonts, colors, backgrounds
    el.removeAttribute("face");
    el.removeAttribute("color");
    el.removeAttribute("size");
    if (el.hasAttribute("style")) {
      const keep: string[] = [];
      for (const part of el.style.cssText.split(";")) {
        const [rawKey, ...rest] = part.split(":");
        if (!rawKey || rest.length === 0) continue;
        const key = rawKey.trim().toLowerCase();
        const val = rest.join(":").trim();
        // Keep only structure-related bold/italic via style if tags missing
        if (
          (key === "font-weight" || key === "font-style" || key === "text-align") &&
          val
        ) {
          keep.push(`${key}: ${val}`);
        }
      }
      if (keep.length) el.setAttribute("style", keep.join("; "));
      else el.removeAttribute("style");
    }

    // Normalize block quotes / headings to paragraphs
    if (/^H[1-6]$/.test(el.tagName)) {
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      while (el.firstChild) strong.appendChild(el.firstChild);
      p.appendChild(strong);
      el.parentNode?.replaceChild(p, el);
      walkText(p);
      return;
    }

    Array.from(el.childNodes).forEach(walkText);
  };

  walkText(template.content);

  // Post-pass: consecutive <p> that look like bullets → ul/ol
  coalesceBulletParagraphs(template.content);

  // fromPaste: drop external fonts/colors — site theme + manual color only
  return sanitizeBioHtml(template.innerHTML, { fromPaste: true });
}

function coalesceBulletParagraphs(root: DocumentFragment | HTMLElement) {
  const children = Array.from(root.childNodes);
  let i = 0;
  while (i < children.length) {
    const node = children[i];
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const el = node as HTMLElement;
    if (el.tagName !== "P" && el.tagName !== "DIV") {
      // recurse into containers
      coalesceBulletParagraphs(el);
      i += 1;
      continue;
    }
    const text = (el.textContent || "").replace(/\u00a0/g, " ");
    const kind = lineKind(text);
    if (kind !== "ul" && kind !== "ol") {
      i += 1;
      continue;
    }

    const list = document.createElement(kind);
    let j = i;
    while (j < children.length) {
      const n = children[j];
      if (n.nodeType !== Node.ELEMENT_NODE) break;
      const e = n as HTMLElement;
      if (e.tagName !== "P" && e.tagName !== "DIV") break;
      const t = (e.textContent || "").replace(/\u00a0/g, " ");
      if (lineKind(t) !== kind) break;
      const li = document.createElement("li");
      // Move children after stripping leading marker from first text node
      while (e.firstChild) li.appendChild(e.firstChild);
      stripLeadingMarkerFromElement(li, kind);
      list.appendChild(li);
      j += 1;
    }
    root.insertBefore(list, children[i]);
    for (let k = i; k < j; k++) {
      root.removeChild(children[k]);
    }
    // refresh list
    const nextChildren = Array.from(root.childNodes);
    children.length = 0;
    children.push(...nextChildren);
    // list sits at i; continue after it
    i += 1;
  }
}

function stripLeadingMarkerFromElement(el: HTMLElement, kind: "ul" | "ol") {
  const first = el.firstChild;
  if (first && first.nodeType === Node.TEXT_NODE) {
    const t = first.textContent || "";
    first.textContent =
      kind === "ul" ? t.replace(BULLET_LINE, "") : t.replace(NUMBERED_LINE, "");
  }
}

/** Plain text for <input> / <textarea> — structure kept via real newlines */
export function clipboardToPlain(
  html: string | null,
  text: string | null,
  singleLine = false
): string {
  let plain = "";

  if (text && text.trim()) {
    plain = text;
  } else if (html && html.trim()) {
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html;
      // Prefer block breaks
      div.querySelectorAll("br").forEach((br) => {
        br.replaceWith("\n");
      });
      div.querySelectorAll("p, div, li, tr, h1, h2, h3, h4, h5, h6").forEach(
        (block) => {
          block.append("\n");
        }
      );
      div.querySelectorAll("li").forEach((li) => {
        if (!/^\s*[•\-\d]/.test(li.textContent || "")) {
          li.prepend("• ");
        }
      });
      plain = div.textContent || "";
    } else {
      plain = html.replace(/<[^>]+>/g, " ");
    }
  }

  plain = normalizeEmojis(plain.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
  // Collapse 3+ blank lines
  plain = plain.replace(/\n{3,}/g, "\n\n").trim();

  if (singleLine) {
    plain = plain.replace(/\s*\n\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  return plain;
}

/**
 * Convert clipboard DataTransfer to sanitized HTML for rich editors.
 */
export function clipboardToRichHtml(
  html: string | null,
  text: string | null
): string {
  const hasHtml =
    html &&
    html.trim() &&
    /<[a-z][\s\S]*>/i.test(html) &&
    // Ignore browser-generated meta-only wrappers without real content
    !/^[\s\S]*<!--\s*StartFragment\s*-->\s*<!--\s*EndFragment\s*-->[\s\S]*$/i.test(
      html.replace(/<meta[^>]*>/gi, "").trim()
    );

  if (hasHtml && html) {
    // Prefer HTML when it has meaningful tags (lists, bold, etc.)
    const meaningful =
      /<(ul|ol|li|b|strong|i|em|p|br|h[1-6]|div|span)[\s>]/i.test(html);
    if (meaningful) {
      return cleanPastedHtml(html);
    }
  }

  if (text && text.trim()) {
    // Plain path: structure + emojis only — no colors/fonts from source
    return sanitizeBioHtml(plainTextToHtml(text), { fromPaste: true });
  }

  if (html && html.trim()) {
    return cleanPastedHtml(html);
  }

  return "";
}

/** Insert HTML at caret in a contentEditable element */
export function insertHtmlAtSelection(html: string): boolean {
  if (!html) return false;
  try {
    // Preferred modern path
    if (document.queryCommandSupported?.("insertHTML")) {
      return document.execCommand("insertHTML", false, html);
    }
  } catch {
    /* fall through */
  }

  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const frag = template.content;
  const last = frag.lastChild;
  range.insertNode(frag);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return true;
}

/** Insert plain text at caret in input/textarea */
export function insertPlainAtInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  text: string
): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  // Use native value setter for React controlled inputs
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  descriptor?.set?.call(el, next);
  const caret = start + text.length;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Handle paste on contentEditable — call from onPaste.
 * Returns true if handled.
 */
export function handleRichPaste(
  e: ReactClipboardEvent | ClipboardEvent
): boolean {
  const dt = "clipboardData" in e ? e.clipboardData : null;
  if (!dt) return false;

  e.preventDefault();
  const html = dt.getData("text/html");
  const text = dt.getData("text/plain");
  const rich = clipboardToRichHtml(html || null, text || null);
  if (!rich) return true;
  insertHtmlAtSelection(rich);
  return true;
}

/**
 * Handle paste on input / textarea.
 * Returns true if handled.
 */
export function handlePlainPaste(
  e: ReactClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  singleLine = false
): boolean {
  const dt = e.clipboardData;
  if (!dt) return false;

  const html = dt.getData("text/html");
  const text = dt.getData("text/plain");
  // Fast path: pure plain emoji/text without structure — let browser handle
  // unless we need emoji normalization or HTML cleanup
  const needsNormalize =
    (html && html.trim()) ||
    /:[a-zA-Z0-9_+-]+:/.test(text) ||
    /[\uFFFD\u00AD\u200B]/.test(text) ||
    (singleLine && /[\r\n]/.test(text)) ||
    (!singleLine &&
      (BULLET_LINE.test(text) ||
        NUMBERED_LINE.test(text) ||
        /\*\*.+\*\*/.test(text)));

  if (!needsNormalize && text && !html) {
    const normalized = normalizeEmojis(text);
    if (normalized === text) return false;
  }

  e.preventDefault();
  const plain = clipboardToPlain(html || null, text || null, singleLine);
  insertPlainAtInput(e.currentTarget, plain);
  return true;
}

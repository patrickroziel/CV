/**
 * Reliable inline formatting for contentEditable.
 * Avoids brittle execCommand failures inside lists / mixed blocks
 * (e.g. colour on text under "Réalisations" after a previous section).
 */

import { restoreSelection, saveSelection } from "@/lib/rich-editor";
import { hostLabel, safeHref, safeImageSrc } from "@/lib/safe-href";

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "LI",
  "UL",
  "OL",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BR",
  "TR",
  "TD",
  "TH",
  "TABLE",
  "BLOCKQUOTE",
]);

function isElement(n: Node): n is HTMLElement {
  return n.nodeType === Node.ELEMENT_NODE;
}

/**
 * Wrap every text segment in the range with a wrapper element.
 * Handles ranges that cross element boundaries (titles + list items).
 */
function wrapRangeWith(
  range: Range,
  createWrapper: () => HTMLElement
): void {
  if (range.collapsed) return;
  const r = range.cloneRange();

  // Fast path: surroundContents when the range is within one element
  try {
    const wrapper = createWrapper();
    r.surroundContents(wrapper);
    if (wrapper.style.fontSize) {
      wrapper.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
        if (el === wrapper) return;
        el.style.removeProperty("font-size");
        if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
      });
    }
    selectNodeContents(wrapper);
    return;
  } catch {
    /* range crosses elements */
  }

  try {
    const contents = r.extractContents();
    const hasBlock = Array.from(contents.querySelectorAll("*")).some((el) =>
      BLOCK_TAGS.has(el.tagName)
    );
    if (hasBlock) {
      wrapTextLeaves(contents, createWrapper);
      r.insertNode(contents);
    } else {
      const wrapper = createWrapper();
      wrapper.appendChild(contents);
      if (wrapper.style.fontSize) {
        wrapper.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
          if (el === wrapper) return;
          el.style.removeProperty("font-size");
          if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
        });
      }
      r.insertNode(wrapper);
      selectNodeContents(wrapper);
    }
  } catch {
    /* caller may fall back */
  }
}

function wrapTextLeaves(
  root: DocumentFragment | HTMLElement,
  createWrapper: () => HTMLElement
): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE && (n.textContent?.length ?? 0) > 0) {
      texts.push(n as Text);
    }
  }
  for (const text of texts) {
    if (!text.parentNode) continue;
    // Don't double-wrap if parent already is our color/format span with same role
    const wrap = createWrapper();
    text.parentNode.insertBefore(wrap, text);
    wrap.appendChild(text);
  }
}

function rangeInEditor(editor: HTMLElement, range: Range | null | undefined): Range | null {
  if (!range) return null;
  try {
    return editor.contains(range.commonAncestorContainer) ? range : null;
  } catch {
    return null;
  }
}

function selectNodeContents(node: Node) {
  const sel = window.getSelection();
  if (!sel) return;
  const nr = document.createRange();
  nr.selectNodeContents(node);
  sel.removeAllRanges();
  sel.addRange(nr);
}

/**
 * Apply a format command to the current (or saved) selection in `editor`.
 */
export function applyRichFormat(
  editor: HTMLElement,
  command: string,
  arg?: string,
  savedRange?: Range | null
): boolean {
  const saved = rangeInEditor(editor, savedRange);
  editor.focus({ preventScroll: true });
  if (saved) restoreSelection(editor, saved);

  const sel = window.getSelection();
  const live = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
  const liveIn = rangeInEditor(editor, live);
  // A toolbar tap (especially on a phone) collapses the caret. Keep the
  // selection that was saved before that tap.
  const active =
    (saved && !saved.collapsed ? saved : null) ??
    (liveIn && !liveIn.collapsed ? liveIn : null) ??
    saved ??
    liveIn;
  if (!active) return false;

  // Block / list commands — execCommand is reliable enough
  if (
    command === "formatBlock" ||
    command === "insertUnorderedList" ||
    command === "insertOrderedList" ||
    command === "justifyLeft" ||
    command === "justifyCenter" ||
    command === "justifyRight"
  ) {
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(command, false, arg);
      return true;
    } catch {
      return false;
    }
  }

  if (command === "bold" || command === "italic" || command === "underline") {
    // Let the browser TOGGLE the formatting. styleWithCSS off keeps <u>,
    // which the sanitizer preserves (text-decoration on a span would not).
    try {
      document.execCommand("styleWithCSS", false, "false");
      return document.execCommand(command, false);
    } catch {
      return false;
    }
  }

  if (command === "createLink" && arg) {
    const href = safeHref(arg);
    if (!href) return false;
    const anchor = anchorFromRange(active);
    if (anchor && editor.contains(anchor)) {
      decorateAnchor(anchor, href);
      return true;
    }
    if (active.collapsed) return false;
    wrapRangeWith(active, () => {
      const created = document.createElement("a");
      decorateAnchor(created, href);
      return created;
    });
    return true;
  }

  if (command === "insertLinkCard" && arg) {
    let data: { url?: string; title?: string; description?: string; image?: string; host?: string };
    try {
      data = JSON.parse(arg) as typeof data;
    } catch {
      return false;
    }
    const href = safeHref(data.url || "");
    if (!href || !/^https?:\/\//i.test(href)) return false;
    const card = document.createElement("blockquote");
    card.className = "rich-link-card";
    card.setAttribute("contenteditable", "false");
    const created = document.createElement("a");
    decorateAnchor(created, href);
    const image = data.image ? safeImageSrc(data.image) : null;
    if (image) {
      const img = document.createElement("img");
      img.src = image;
      img.alt = "";
      img.className = "rich-link-card-img";
      created.appendChild(img);
    }
    const copy = document.createElement("span");
    copy.className = "rich-link-card-copy";
    const host = document.createElement("span");
    host.className = "rich-link-card-host";
    host.textContent = (data.host || hostLabel(href)).slice(0, 80);
    const title = document.createElement("span");
    title.className = "rich-link-card-title";
    title.textContent = (data.title || hostLabel(href)).slice(0, 180);
    copy.append(host, title);
    if (data.description?.trim()) {
      const desc = document.createElement("span");
      desc.className = "rich-link-card-desc";
      desc.textContent = data.description.trim().slice(0, 240);
      copy.appendChild(desc);
    }
    created.appendChild(copy);
    card.appendChild(created);
    insertBlockAfterCaret(editor, card, active);
    return true;
  }

  if (command === "foreColor" && arg) {
    const color = arg;
    if (!active.collapsed) {
      wrapRangeWith(active, () => {
        const span = document.createElement("span");
        span.style.color = color;
        // Durable marker — survives sanitizer even if style is rewritten
        span.setAttribute("data-rich-color", color);
        return span;
      });
      return true;
    }
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, color);
      return true;
    } catch {
      return false;
    }
  }

  if (command === "fontSizePx" && arg) {
    const parsed = Number(String(arg).replace(",", "."));
    if (!Number.isFinite(parsed)) return false;
    const px = Math.min(96, Math.max(6, parsed));
    const size = `${Math.round(px * 10) / 10}px`;

    if (!active.collapsed) {
      wrapRangeWith(active, () => {
        const span = document.createElement("span");
        span.style.fontSize = size;
        return span;
      });
      return true;
    }

    // With no selection, keep the caret usable: apply the nearest browser size
    // so newly typed text is still formatted. Exact px is intended for a selection.
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, px < 13 ? "1" : px < 15 ? "2" : px < 18 ? "3" : px < 21 ? "4" : px < 25 ? "5" : px < 30 ? "6" : "7");
      return true;
    } catch {
      return false;
    }
  }

  if (command === "fontSize" && arg) {
    const map: Record<string, string> = {
      "1": "0.75rem",
      "2": "0.875rem",
      "3": "1rem",
      "4": "1.125rem",
      "5": "1.35rem",
      "6": "1.6rem",
      "7": "2rem",
    };
    const size = map[arg] || "1rem";
    if (!active.collapsed) {
      wrapRangeWith(active, () => {
        const span = document.createElement("span");
        span.style.fontSize = size;
        return span;
      });
      return true;
    }
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, arg);
      return true;
    } catch {
      return false;
    }
  }

  try {
    document.execCommand("styleWithCSS", false, "true");
    return document.execCommand(command, false, arg);
  } catch {
    return false;
  }
}

function decorateAnchor(anchor: HTMLAnchorElement, href: string) {
  anchor.setAttribute("href", href);
  if (/^https?:\/\//i.test(href)) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  } else {
    anchor.removeAttribute("target");
    anchor.removeAttribute("rel");
  }
}

function anchorFromRange(range: Range): HTMLAnchorElement | null {
  const node = range.startContainer;
  const element = node instanceof Element ? node : node.parentElement;
  const anchor = element?.closest("a");
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

function insertBlockAfterCaret(editor: HTMLElement, block: HTMLElement, range: Range) {
  let child: Node | null = range.startContainer;
  while (child?.parentNode && child.parentNode !== editor) child = child.parentNode;
  if (child && child.parentNode === editor) child.parentNode.insertBefore(block, child.nextSibling);
  else editor.appendChild(block);
  const next = document.createElement("p");
  next.appendChild(document.createElement("br"));
  block.after(next);
  const selection = window.getSelection();
  if (!selection) return;
  const caret = document.createRange();
  caret.selectNodeContents(next);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
}

function unwrapElement(el: HTMLElement): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/**
 * Keep editor markup small and predictable.
 * Repeated toolbar clicks used to create chains such as
 * <strong><strong>…</strong></strong> and nested font-size spans.
 */
function cleanupInlineFormatting(root: HTMLElement): void {
  // Canonical semantic tags first.
  root.querySelectorAll("b").forEach((el) => {
    const strong = document.createElement("strong");
    while (el.firstChild) strong.appendChild(el.firstChild);
    for (const attr of Array.from(el.attributes)) strong.setAttribute(attr.name, attr.value);
    el.replaceWith(strong);
  });
  root.querySelectorAll("i").forEach((el) => {
    const em = document.createElement("em");
    while (el.firstChild) em.appendChild(el.firstChild);
    for (const attr of Array.from(el.attributes)) em.setAttribute(attr.name, attr.value);
    el.replaceWith(em);
  });

  // Collapse duplicate bold/italic wrappers.
  let guard = 0;
  while (guard++ < 12) {
    const duplicate = root.querySelector<HTMLElement>("strong strong, em em");
    if (!duplicate) break;
    unwrapElement(duplicate);
  }

  // Merge a span whose only meaningful child is another span. Child styles
  // are newer and therefore win over the outer legacy style.
  guard = 0;
  while (guard++ < 20) {
    let changed = false;
    const spans = Array.from(root.querySelectorAll<HTMLElement>("span")).reverse();
    for (const outer of spans) {
      const meaningful = Array.from(outer.childNodes).filter(
        (n) => n.nodeType !== Node.TEXT_NODE || Boolean(n.textContent?.trim())
      );
      if (meaningful.length !== 1) continue;
      const only = meaningful[0];
      if (!(only instanceof HTMLElement) || only.tagName !== "SPAN") continue;
      const inner = only as HTMLElement;
      const outerStyle = outer.style.cssText;
      const innerStyle = inner.style.cssText;
      if (outerStyle) inner.style.cssText = `${outerStyle};${innerStyle}`;
      const outerColor = outer.getAttribute("data-rich-color");
      if (outerColor && !inner.getAttribute("data-rich-color")) {
        inner.setAttribute("data-rich-color", outerColor);
      }
      const parent = outer.parentNode;
      if (!parent) continue;
      outer.removeChild(inner);
      parent.replaceChild(inner, outer);
      changed = true;
    }
    if (!changed) break;
  }

  // Empty formatting nodes are noise and make toggling unpredictable.
  root.querySelectorAll<HTMLElement>("span,strong,em").forEach((el) => {
    const hasBreak = Boolean(el.querySelector("br"));
    if (!hasBreak && !(el.textContent || "").replace(/\u00a0/g, " ").trim()) {
      el.remove();
      return;
    }
    if (el.tagName === "SPAN" && el.attributes.length === 0) unwrapElement(el);
  });
}

/**
 * Flatten body HTML into a homogeneous editable tree:
 * p / ul / ol / li + inline tags — unwrap stray DIVs that break selection/formatting.
 */
export function normalizeRichBody(html: string): string {
  if (!html || typeof document === "undefined") return html || "";

  const shell = document.createElement("div");
  shell.innerHTML = html;

  // Unwrap outer line-height marker if present
  if (
    shell.childNodes.length === 1 &&
    shell.firstElementChild?.tagName === "DIV"
  ) {
    const only = shell.firstElementChild as HTMLElement;
    if (
      only.hasAttribute("data-rich-lh") ||
      only.classList.contains("rich-lh") ||
      /\brich-spacing-/.test(only.className)
    ) {
      shell.innerHTML = only.innerHTML;
    }
  }

  // Iteratively unwrap non-semantic DIVs (keep children)
  let guard = 0;
  while (guard++ < 20) {
    const divs = Array.from(shell.querySelectorAll("div")).filter((d) => {
      // Keep if it is ONLY a color span parent? unwrap all plain divs
      // Never unwrap if it has data-rich-lh (shouldn't be inside body)
      return (
        !d.hasAttribute("data-rich-lh") &&
        !d.classList.contains("rich-lh")
      );
    });
    if (divs.length === 0) break;
    // Unwrap deepest first
    divs.sort(
      (a, b) =>
        b.querySelectorAll("div").length - a.querySelectorAll("div").length
    );
    for (const d of divs) {
      const parent = d.parentNode;
      if (!parent) continue;
      while (d.firstChild) parent.insertBefore(d.firstChild, d);
      parent.removeChild(d);
    }
  }

  // Top-level bare text → <p>
  Array.from(shell.childNodes).forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const t = (node.textContent || "").replace(/\u00a0/g, " ");
    if (!t.trim()) {
      shell.removeChild(node);
      return;
    }
    const p = document.createElement("p");
    p.textContent = t;
    shell.replaceChild(p, node);
  });

  // UL/OL children must be LI
  shell.querySelectorAll("ul, ol").forEach((list) => {
    Array.from(list.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = (child.textContent || "").trim();
        if (!t) {
          list.removeChild(child);
          return;
        }
        const li = document.createElement("li");
        li.textContent = t;
        list.replaceChild(li, child);
      } else if (isElement(child) && child.tagName !== "LI") {
        const li = document.createElement("li");
        while (child.firstChild) li.appendChild(child.firstChild);
        list.replaceChild(li, child);
      }
    });
  });

  // Ensure color markers have style.color
  shell.querySelectorAll("[data-rich-color]").forEach((el) => {
    if (!isElement(el)) return;
    const c = el.getAttribute("data-rich-color");
    if (c) el.style.color = c;
  });

  cleanupInlineFormatting(shell);
  return shell.innerHTML;
}

/** Compact fields (name/title/badges) use one visual line per Enter. */
export function normalizeCompactRichBody(html: string): string {
  if (!html || typeof document === "undefined") return html || "";
  const shell = document.createElement("div");
  shell.innerHTML = normalizeRichBody(html);

  // Empty paragraphs are accidental in compact fields. Non-empty paragraphs
  // become a simple <br>, avoiding the apparent “double Enter” spacing.
  const blocks = Array.from(shell.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && (el.tagName === "P" || el.tagName === "DIV")
  );
  for (const block of blocks) {
    const hasContent = Boolean((block.textContent || "").replace(/\u00a0/g, " ").trim()) || Boolean(block.querySelector("br"));
    if (!hasContent) {
      block.remove();
      continue;
    }
    const frag = document.createDocumentFragment();
    while (block.firstChild) frag.appendChild(block.firstChild);
    const br = document.createElement("br");
    block.replaceWith(frag, br);
  }

  // One break maximum, and never at the beginning/end.
  let previousWasBr = false;
  for (const node of Array.from(shell.childNodes)) {
    const isBr = node instanceof HTMLElement && node.tagName === "BR";
    if (isBr && previousWasBr) node.remove();
    previousWasBr = isBr;
  }
  while (shell.firstElementChild?.tagName === "BR") shell.firstElementChild.remove();
  while (shell.lastElementChild?.tagName === "BR") shell.lastElementChild.remove();

  cleanupInlineFormatting(shell);
  return shell.innerHTML;
}

/** After sanitize: re-apply data-rich-color onto style.color */
export function restoreColorMarkers(html: string): string {
  if (!html || typeof document === "undefined") return html;
  const shell = document.createElement("div");
  shell.innerHTML = html;
  shell.querySelectorAll("[data-rich-color]").forEach((el) => {
    if (!isElement(el)) return;
    const c = el.getAttribute("data-rich-color");
    if (c) el.style.color = c;
  });
  // Persist style colors as markers for the next sanitize round-trip
  shell.querySelectorAll("span[style]").forEach((el) => {
    if (!isElement(el)) return;
    const c = el.style.color;
    if (c) el.setAttribute("data-rich-color", rgbToHexOrKeep(c));
  });
  return shell.innerHTML;
}

function rgbToHexOrKeep(color: string): string {
  const m = color.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
  );
  if (!m) return color;
  const h = (n: string) =>
    Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, "0");
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
}

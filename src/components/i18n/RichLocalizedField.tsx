"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { RichTextToolbar } from "@/components/i18n/RichTextToolbar";
import { getL, setL, type MaybeLocalized } from "@/lib/i18n-content";
import { handleRichPaste } from "@/lib/clipboard-paste";
import { captureEditorSelection } from "@/lib/rich-editor";
import { applyRichFormat, normalizeCompactRichBody, normalizeRichBody } from "@/lib/rich-format";
import { DEFAULT_LINE_HEIGHT, extractRichSpacing, wrapWithRichSpacing } from "@/lib/rich-spacing";
import { sanitizeBioHtml, toEditableHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

type RichLocalizedFieldProps = {
  label: string;
  value: MaybeLocalized;
  onChange: (next: ReturnType<typeof setL>) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
  className?: string;
  compact?: boolean;
  hint?: string;
  insertBlockToken?: { nonce: string; token: string };
};

export function RichLocalizedField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  id,
  className,
  compact = false,
  hint,
  insertBlockToken,
}: RichLocalizedFieldProps) {
  const fieldId = id || `rich-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const editorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const skipSyncRef = useRef(false);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const minHeight = compact ? 2.5 : Math.max(3, rows) * 1.4;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = getL(value, "fr");
    const { lineHeight: storedLh } = extractRichSpacing(next || "");
    setLineHeight(storedLh);

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (rootRef.current?.contains(document.activeElement)) return;
    const html = toEditableHtml(next || "");
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value]);

  const commit = () => {
    const el = editorRef.current;
    if (!el) return;
    const flat = compact ? normalizeCompactRichBody(el.innerHTML) : normalizeRichBody(el.innerHTML);
    const body = sanitizeBioHtml(flat);
    const html = wrapWithRichSpacing(body, lineHeight);
    skipSyncRef.current = true;
    onChange(setL(value, "fr", html));
  };

  // Keep the media marker as an editable paragraph in the existing rich editor.
  // Clicking Insert may blur the editor; its previous caret is saved in savedRangeRef.
  const handledMediaRequest = useRef<string | null>(null);
  useEffect(() => {
    const request = insertBlockToken;
    const el = editorRef.current;
    if (!request || !el || handledMediaRequest.current === request.nonce) return;
    if (!/^\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]$/.test(request.token)) return;
    handledMediaRequest.current = request.nonce;
    const range = savedRangeRef.current;
    let child: Node | null = range && el.contains(range.startContainer) ? range.startContainer : null;
    // Move to the top-level block; never inject an invalid DIV into a <p>.
    while (child?.parentNode && child.parentNode !== el) child = child.parentNode;
    const markerBlock = document.createElement("p");
    markerBlock.textContent = request.token;
    const nextParagraph = document.createElement("p");
    nextParagraph.appendChild(document.createElement("br"));
    if (child && child.parentNode === el) child.parentNode.insertBefore(markerBlock, child.nextSibling);
    else el.appendChild(markerBlock);
    markerBlock.after(nextParagraph);
    const selection = window.getSelection();
    if (selection) {
      const caret = document.createRange();
      caret.selectNodeContents(nextParagraph);
      caret.collapse(true);
      selection.removeAllRanges();
      selection.addRange(caret);
      savedRangeRef.current = caret.cloneRange();
    }
    commit();
  }, [insertBlockToken?.nonce]);

  const rememberSelection = () => {
    savedRangeRef.current = captureEditorSelection(editorRef.current);
  };

  const run = (command: string, arg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    const range = savedRangeRef.current ?? captureEditorSelection(el);
    applyRichFormat(el, command, arg, range);
    savedRangeRef.current = captureEditorSelection(el);
    requestAnimationFrame(commit);
  };

  return (
    <div ref={rootRef} className={cn("grid gap-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div onMouseDownCapture={rememberSelection}>
        <RichTextToolbar onCommand={run} compact={compact} />
      </div>
      <div
        id={fieldId}
        ref={editorRef}
        role="textbox"
        aria-multiline={!compact}
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || "Écrivez ici…"}
        onInput={commit}
        onBlur={commit}
        onMouseUp={rememberSelection}
        onKeyDown={(e) => {
          if (compact && e.key === "Enter") {
            e.preventDefault();
            document.execCommand("insertHTML", false, "<br>");
            requestAnimationFrame(commit);
          }
        }}
        onKeyUp={rememberSelection}
        onPaste={(e) => {
          if (handleRichPaste(e)) {
            requestAnimationFrame(() => {
              const el = editorRef.current;
              if (!el) return;
              el.innerHTML = compact ? normalizeCompactRichBody(el.innerHTML) : normalizeRichBody(el.innerHTML);
              commit();
            });
          }
        }}
        className={cn(
          "rich-bio-editor w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-sm text-zinc-100 outline-none",
          "focus:border-teal-300/40 focus:ring-1 focus:ring-teal-300/30",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-cyan-300/80 [&_blockquote]:pl-4 [&_blockquote]:italic",
          "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic rich-lh"
        )}
        style={{ minHeight: `${minHeight}rem`, lineHeight }}
      />
      {hint ? <p className="text-[10px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

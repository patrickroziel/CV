"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { RichTextToolbar } from "@/components/i18n/RichTextToolbar";
import { handleRichPaste } from "@/lib/clipboard-paste";
import { captureEditorSelection } from "@/lib/rich-editor";
import { applyRichFormat, normalizeCompactRichBody, normalizeRichBody } from "@/lib/rich-format";
import {
  DEFAULT_LINE_HEIGHT,
  clampLineHeight,
  extractRichSpacing,
  formatLineHeight,
  wrapWithRichSpacing,
} from "@/lib/rich-spacing";
import { sanitizeBioHtml, toEditableHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

type RichTextFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
  className?: string;
  compact?: boolean;
  hint?: string;
};

export function RichTextField({
  label,
  value,
  onChange,
  rows = 2,
  placeholder,
  id,
  className,
  compact = false,
  hint,
}: RichTextFieldProps) {
  const fieldId = id || `rich-plain-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const editorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineHeightRef = useRef(DEFAULT_LINE_HEIGHT);
  const savedRangeRef = useRef<Range | null>(null);
  const skipSyncRef = useRef(false);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const minHeight = compact ? 2.5 : Math.max(2.5, rows) * 1.45;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (rootRef.current?.contains(document.activeElement)) return;
    const { lineHeight: storedLh } = extractRichSpacing(value || "");
    lineHeightRef.current = storedLh;
    setLineHeight(storedLh);
    const next = toEditableHtml(value || "");
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const commit = (nextLh?: number) => {
    const el = editorRef.current;
    if (!el) return;
    const lh = nextLh ?? lineHeightRef.current;
    const flat = compact
      ? normalizeCompactRichBody(el.innerHTML)
      : normalizeRichBody(el.innerHTML);
    const body = sanitizeBioHtml(flat);
    skipSyncRef.current = true;
    onChange(wrapWithRichSpacing(body, lh));
  };

  const rememberSelection = () => {
    savedRangeRef.current = captureEditorSelection(editorRef.current);
  };

  const run = (command: string, arg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    const range = savedRangeRef.current ?? captureEditorSelection(el);
    applyRichFormat(el, command, arg, range);
    savedRangeRef.current = captureEditorSelection(el);
    requestAnimationFrame(() => commit());
  };

  const handleLineHeight = (raw: number) => {
    const next = clampLineHeight(raw);
    lineHeightRef.current = next;
    setLineHeight(next);
    commit(next);
  };

  return (
    <div ref={rootRef} className={cn("grid gap-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div onMouseDownCapture={rememberSelection}>
        <RichTextToolbar
          onCommand={run}
          compact={compact}
          lineHeight={lineHeight}
          onLineHeightChange={compact ? undefined : handleLineHeight}
        />
      </div>
      <div
        id={fieldId}
        ref={editorRef}
        role="textbox"
        aria-multiline={!compact}
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || ""}
        onInput={() => commit()}
        onBlur={() => commit()}
        onMouseUp={rememberSelection}
        onKeyDown={(e) => {
          if (compact && e.key === "Enter") {
            e.preventDefault();
            // Compact fields use a single visual line break, not a new
            // paragraph with extra spacing.
            document.execCommand("insertHTML", false, "<br>");
            requestAnimationFrame(() => commit());
          }
        }}
        onKeyUp={rememberSelection}
        onPaste={(e) => {
          if (handleRichPaste(e)) {
            requestAnimationFrame(() => {
              const el = editorRef.current;
              if (!el) return;
              el.innerHTML = compact
                ? normalizeCompactRichBody(el.innerHTML)
                : normalizeRichBody(el.innerHTML);
              commit();
            });
          }
        }}
        className={cn(
          "rich-bio-editor w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-sm text-zinc-100 outline-none",
          "focus:border-teal-300/40 focus:ring-1 focus:ring-teal-300/30",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic",
          "rich-lh",
          compact && "py-2"
        )}
        style={{
          minHeight: `${minHeight}rem`,
          lineHeight: formatLineHeight(lineHeight),
        }}
      />
      {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
    </div>
  );
}

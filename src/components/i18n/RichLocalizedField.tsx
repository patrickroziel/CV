"use client";

import { useEffect, useRef, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Label } from "@/components/ui/label";
import { RichTextToolbar } from "@/components/i18n/RichTextToolbar";
import { LOCALES, LOCALE_META } from "@/i18n/locales";
import {
  isLocaleFilled,
  setL,
  type MaybeLocalized,
} from "@/lib/i18n-content";
import { handleRichPaste } from "@/lib/clipboard-paste";
import { captureEditorSelection } from "@/lib/rich-editor";
import { applyRichFormat, normalizeRichBody } from "@/lib/rich-format";
import {
  DEFAULT_LINE_HEIGHT,
  clampLineHeight,
  extractRichSpacing,
  formatLineHeight,
  wrapWithRichSpacing,
} from "@/lib/rich-spacing";
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
};

/**
 * Localized rich-text editor — one homogeneous editable surface.
 * Bold / italic / colour work on any selection (titles, list items, etc.).
 */
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
}: RichLocalizedFieldProps) {
  const { editingLocale, le, t } = usePortfolio();
  const fieldId = id || `rich-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const editorRef = useRef<HTMLDivElement>(null);
  const lastLocale = useRef(editingLocale);
  const lineHeightRef = useRef(DEFAULT_LINE_HEIGHT);
  const savedRangeRef = useRef<Range | null>(null);
  /** Skip external value→DOM sync right after our own commit */
  const skipSyncRef = useRef(false);
  const [lineHeight, setLineHeight] = useState(DEFAULT_LINE_HEIGHT);
  const minHeight = compact ? 2.5 : Math.max(3, rows) * 1.4;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = le(value);
    const localeChanged = lastLocale.current !== editingLocale;
    lastLocale.current = editingLocale;
    const { lineHeight: storedLh } = extractRichSpacing(next || "");
    if (localeChanged || lineHeightRef.current !== storedLh) {
      lineHeightRef.current = storedLh;
      setLineHeight(storedLh);
    }

    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    // Never clobber the live editor while focused (typing / selection)
    if (!localeChanged && document.activeElement === el) return;

    const html = toEditableHtml(next || "");
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [editingLocale, value, le]);

  const commit = (nextLh?: number) => {
    const el = editorRef.current;
    if (!el) return;
    const lh = nextLh ?? lineHeightRef.current;
    // Normalize → sanitize so every block (incl. list items) keeps inline styles
    const flat = normalizeRichBody(el.innerHTML);
    const body = sanitizeBioHtml(flat);
    const html = wrapWithRichSpacing(body, lh);
    skipSyncRef.current = true;
    onChange(setL(value, editingLocale, html));
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
    // Defer commit so the browser finishes DOM mutation first
    requestAnimationFrame(() => commit());
  };

  const handleLineHeight = (raw: number) => {
    const next = clampLineHeight(raw);
    lineHeightRef.current = next;
    setLineHeight(next);
    commit(next);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        <div className="flex gap-0.5">
          {LOCALES.map((code) => {
            const filled = isLocaleFilled(value, code);
            const active = code === editingLocale;
            return (
              <span
                key={code}
                title={filled ? t("edit.filled") : t("edit.missing")}
                className={cn(
                  "rounded px-1 text-[9px] font-bold uppercase",
                  active && "ring-1 ring-amber-300/50",
                  filled
                    ? "bg-teal-300/20 text-teal-200"
                    : "bg-white/5 text-zinc-600"
                )}
              >
                {LOCALE_META[code].short}
              </span>
            );
          })}
        </div>
      </div>

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
        data-placeholder={placeholder || t("edit.fallbackHint")}
        onInput={() => commit()}
        onBlur={() => commit()}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onPaste={(e) => {
          if (handleRichPaste(e)) {
            requestAnimationFrame(() => {
              const el = editorRef.current;
              if (!el) return;
              el.innerHTML = normalizeRichBody(el.innerHTML);
              commit();
            });
          }
        }}
        className={cn(
          "rich-bio-editor w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2 text-sm text-zinc-100 outline-none",
          "focus:border-teal-300/40 focus:ring-1 focus:ring-teal-300/30",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic",
          "[&_span[data-rich-color]]:font-inherit",
          "rich-lh"
        )}
        style={{
          minHeight: `${minHeight}rem`,
          lineHeight: formatLineHeight(lineHeight),
        }}
      />
      {hint !== undefined ? (
        hint ? (
          <p className="text-[10px] text-zinc-500">{hint}</p>
        ) : null
      ) : (
        <p className="text-[10px] text-zinc-500">
          Une seule zone : titres et puces acceptent gras, italique et couleur.
          Interligne : + / − (défaut {formatLineHeight(DEFAULT_LINE_HEIGHT)}).
        </p>
      )}
    </div>
  );
}

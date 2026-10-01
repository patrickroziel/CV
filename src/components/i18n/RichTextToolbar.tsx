"use client";

import { useEffect, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
} from "lucide-react";
import {
  LINE_HEIGHT_STEP,
  clampLineHeight,
  formatLineHeight,
  parseLineHeightInput,
} from "@/lib/rich-spacing";
import { cn } from "@/lib/utils";

type RichTextToolbarProps = {
  onCommand: (command: string, arg?: string) => void;
  className?: string;
  /** Compact single-line fields */
  compact?: boolean;
  /** Numeric line-height for the whole field */
  lineHeight?: number;
  onLineHeightChange?: (value: number) => void;
};

/**
 * Visual formatting toolbar for contentEditable rich fields.
 * Uses document.execCommand under the hood (no raw HTML UI).
 */
export function RichTextToolbar({
  onCommand,
  className,
  compact = false,
  lineHeight,
  onLineHeightChange,
}: RichTextToolbarProps) {
  const btn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-200 transition hover:bg-white/10 hover:text-white";

  const [lhDraft, setLhDraft] = useState(
    lineHeight != null ? formatLineHeight(lineHeight) : "1.25"
  );
  const [fontSizeDraft, setFontSizeDraft] = useState("14");

  const commitFontSize = (raw = fontSizeDraft) => {
    const parsed = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(parsed)) {
      setFontSizeDraft("14");
      return;
    }
    const clamped = Math.min(96, Math.max(6, parsed));
    const normalized = Number.isInteger(clamped)
      ? String(clamped)
      : String(Math.round(clamped * 10) / 10);
    setFontSizeDraft(normalized);
    onCommand("fontSizePx", normalized);
  };

  useEffect(() => {
    if (lineHeight != null) setLhDraft(formatLineHeight(lineHeight));
  }, [lineHeight]);

  const commitLhDraft = () => {
    if (!onLineHeightChange || lineHeight == null) return;
    const parsed = parseLineHeightInput(lhDraft);
    const next = parsed ?? lineHeight;
    setLhDraft(formatLineHeight(next));
    onLineHeightChange(next);
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-1.5 py-1",
        compact && "gap-0.5",
        className
      )}
      onMouseDown={(e) => {
        // Keep selection in the editor when clicking toolbar (except text inputs)
        const t = e.target as HTMLElement;
        if (t.closest("input")) return;
        e.preventDefault();
      }}
    >
      <button
        type="button"
        title="Gras"
        className={btn}
        onClick={() => onCommand("bold")}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Italique"
        className={btn}
        onClick={() => onCommand("italic")}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      {!compact && (
        <>
          <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
          <button
            type="button"
            title="Liste à puces"
            className={btn}
            onClick={() => onCommand("insertUnorderedList")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Liste numérotée"
            className={btn}
            onClick={() => onCommand("insertOrderedList")}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
        </>
      )}

      {!compact && onLineHeightChange && lineHeight != null && (
        <>
          <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
          <div
            className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5"
            title="Interligne de toute la description"
          >
            <span className="hidden px-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500 sm:inline">
              Interligne
            </span>
            <button
              type="button"
              title="Diminuer l’interligne"
              className={btn}
              onClick={() =>
                onLineHeightChange(
                  clampLineHeight(lineHeight - LINE_HEIGHT_STEP)
                )
              }
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Interligne"
              value={lhDraft}
              onChange={(e) => setLhDraft(e.target.value)}
              onBlur={commitLhDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitLhDraft();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="h-7 w-12 rounded-md border border-white/10 bg-black/40 px-1 text-center text-[11px] font-semibold tabular-nums text-zinc-100 outline-none focus:border-teal-300/40"
            />
            <button
              type="button"
              title="Augmenter l’interligne"
              className={btn}
              onClick={() =>
                onLineHeightChange(
                  clampLineHeight(lineHeight + LINE_HEIGHT_STEP)
                )
              }
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

      <div
        className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5"
        title="Taille du texte sélectionné en pixels (6 à 96 px)"
      >
        <span className="hidden px-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500 sm:inline">
          Taille
        </span>
        <button
          type="button"
          title="Réduire la taille de 1 px"
          className={btn}
          onClick={() => {
            const current = Number(String(fontSizeDraft).replace(",", "."));
            commitFontSize(String((Number.isFinite(current) ? current : 14) - 1));
          }}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Taille de police en pixels"
          value={fontSizeDraft}
          onChange={(e) => setFontSizeDraft(e.target.value)}
          onBlur={() => commitFontSize()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitFontSize();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-7 w-11 rounded-md border border-white/10 bg-black/40 px-1 text-center text-[11px] font-semibold tabular-nums text-zinc-100 outline-none focus:border-teal-300/40"
        />
        <span className="pr-0.5 text-[9px] text-zinc-500">px</span>
        <button
          type="button"
          title="Augmenter la taille de 1 px"
          className={btn}
          onClick={() => {
            const current = Number(String(fontSizeDraft).replace(",", "."));
            commitFontSize(String((Number.isFinite(current) ? current : 14) + 1));
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

      <label
        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-1.5 text-[10px] text-zinc-400 transition hover:bg-white/5"
        title="Couleur du texte (sélection)"
      >
        <span className="hidden sm:inline">Couleur</span>
        <input
          type="color"
          defaultValue="#f4f4f5"
          className="h-6 w-7 cursor-pointer rounded border border-white/15 bg-transparent p-0"
          onChange={(e) => onCommand("foreColor", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      </label>

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />

      <button
        type="button"
        title="Aligner à gauche"
        className={btn}
        onClick={() => onCommand("justifyLeft")}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Centrer"
        className={btn}
        onClick={() => onCommand("justifyCenter")}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Aligner à droite"
        className={btn}
        onClick={() => onCommand("justifyRight")}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

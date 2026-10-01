"use client";

import { useState } from "react";
import { Bold, Eraser, Italic, List, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type RichTextToolbarProps = {
  onCommand: (command: string, arg?: string) => void;
  className?: string;
  compact?: boolean;
  lineHeight?: number;
  onLineHeightChange?: (value: number) => void;
};

/** Barre volontairement réduite : gras, italique, taille, liste et remise à zéro. */
export function RichTextToolbar({ onCommand, className, compact = false }: RichTextToolbarProps) {
  const btn = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-200 transition hover:bg-white/10 hover:text-white";
  const [fontSizeDraft, setFontSizeDraft] = useState("14");

  const commitFontSize = (raw = fontSizeDraft) => {
    const parsed = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(96, Math.max(6, parsed));
    const normalized = Number.isInteger(clamped) ? String(clamped) : String(Math.round(clamped * 10) / 10);
    setFontSizeDraft(normalized);
    onCommand("fontSizePx", normalized);
  };

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-1.5 py-1", className)}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("input")) return;
        e.preventDefault();
      }}
    >
      <button type="button" title="Gras" className={btn} onClick={() => onCommand("bold")}><Bold className="h-3.5 w-3.5" /></button>
      <button type="button" title="Italique" className={btn} onClick={() => onCommand("italic")}><Italic className="h-3.5 w-3.5" /></button>
      {!compact && <button type="button" title="Liste à puces" className={btn} onClick={() => onCommand("insertUnorderedList")}><List className="h-3.5 w-3.5" /></button>}

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
      <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5" title="Taille du texte sélectionné">
        <button type="button" title="Réduire" className={btn} onClick={() => commitFontSize(String((Number(fontSizeDraft) || 14) - 1))}><Minus className="h-3.5 w-3.5" /></button>
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
        <button type="button" title="Augmenter" className={btn} onClick={() => commitFontSize(String((Number(fontSizeDraft) || 14) + 1))}><Plus className="h-3.5 w-3.5" /></button>
      </div>

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
      <button type="button" title="Effacer la mise en forme de la sélection" className={btn} onClick={() => onCommand("removeFormat")}><Eraser className="h-3.5 w-3.5" /></button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bold, Eraser, Italic, Link2, List, Quote, Minus, Plus, Underline } from "lucide-react";
import { safeHref } from "@/lib/safe-href";
import { cn } from "@/lib/utils";

type RichTextToolbarProps = {
  onCommand: (command: string, arg?: string) => void | boolean;
  className?: string;
  compact?: boolean;
  lineHeight?: number;
  onLineHeightChange?: (value: number) => void;
};

/** Gras, italique, souligné, lien, taille, liste et remise à zéro. */
export function RichTextToolbar({ onCommand, className, compact = false }: RichTextToolbarProps) {
  const btn = "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-200 transition hover:bg-white/10 hover:text-white";
  const [fontSizeDraft, setFontSizeDraft] = useState("14");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState("");

  const commitFontSize = (raw = fontSizeDraft) => {
    const parsed = Number(String(raw).replace(",", "."));
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(96, Math.max(6, parsed));
    const normalized = Number.isInteger(clamped) ? String(clamped) : String(Math.round(clamped * 10) / 10);
    setFontSizeDraft(normalized);
    onCommand("fontSizePx", normalized);
  };

  const applyTextLink = () => {
    const href = safeHref(linkUrl);
    if (!href) {
      setLinkError("Adresse invalide.");
      return;
    }
    const applied = onCommand("createLink", href);
    if (applied === false) {
      setLinkError("Sélectionne d’abord les mots à lier.");
      return;
    }
    setLinkError("");
    setLinkOpen(false);
    setLinkUrl("");
  };

  const applyLinkCard = async () => {
    const href = safeHref(linkUrl);
    if (!href || !/^https?:\/\//i.test(href)) {
      setLinkError("Le bloc aperçu demande une adresse http ou https.");
      return;
    }
    setLinkBusy(true);
    setLinkError("");
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`);
      const data = await response.json() as { url?: string; title?: string; description?: string; image?: string; host?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Aperçu indisponible");
      onCommand("insertLinkCard", JSON.stringify(data));
      setLinkOpen(false);
      setLinkUrl("");
    } catch {
      onCommand("insertLinkCard", JSON.stringify({ url: href, title: href, description: "", image: "", host: "" }));
      setLinkOpen(false);
      setLinkUrl("");
    } finally {
      setLinkBusy(false);
    }
  };

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-1.5 py-1", className)}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("input, button")) return;
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("input, textarea")) return;
        if (target.closest("button")) e.preventDefault();
      }}
    >
      <button type="button" title="Gras" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("bold")}><Bold className="h-3.5 w-3.5" /></button>
      <button type="button" title="Italique" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("italic")}><Italic className="h-3.5 w-3.5" /></button>
      <button type="button" title="Souligner" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("underline")}><Underline className="h-3.5 w-3.5" /></button>
      <button type="button" title="Lien" aria-expanded={linkOpen} className={cn(btn, linkOpen && "bg-white/15 text-white")} onMouseDown={(e) => e.preventDefault()} onClick={() => { setLinkOpen((open) => !open); setLinkError(""); }}><Link2 className="h-3.5 w-3.5" /></button>
      {!compact && <button type="button" title="Citation — barre verticale" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("formatBlock", "blockquote")}><Quote className="h-3.5 w-3.5" /></button>}
      {!compact && <button type="button" title="Liste à puces" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("insertUnorderedList")}><List className="h-3.5 w-3.5" /></button>}

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
      <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5" title="Taille du texte sélectionné">
        <button type="button" data-fontsize-step title="Réduire" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => commitFontSize(String((Number(fontSizeDraft) || 14) - 1))}><Minus className="h-3.5 w-3.5" /></button>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Taille de police en pixels"
          value={fontSizeDraft}
          onChange={(e) => setFontSizeDraft(e.target.value)}
          onBlur={(e) => {
            const next = e.relatedTarget as HTMLElement | null;
            if (next?.closest("[data-fontsize-step]")) return;
            commitFontSize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              commitFontSize();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-7 w-11 rounded-md border border-white/10 bg-black/40 px-1 text-center text-[11px] font-semibold tabular-nums text-zinc-100 outline-none focus:border-teal-300/40"
        />
        <span className="pr-0.5 text-[9px] text-zinc-500">px</span>
        <button type="button" data-fontsize-step title="Augmenter" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => commitFontSize(String((Number(fontSizeDraft) || 14) + 1))}><Plus className="h-3.5 w-3.5" /></button>
      </div>

      <span className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
      <button type="button" title="Effacer la mise en forme de la sélection" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => onCommand("removeFormat")}><Eraser className="h-3.5 w-3.5" /></button>

      {linkOpen && (
        <form
          className="mt-1 flex w-full min-w-0 basis-full flex-col gap-2 rounded-lg border border-white/10 bg-black/40 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            applyTextLink();
          }}
        >
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Adresse
            <input
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                e.stopPropagation();
                applyTextLink();
              }}
              className="h-9 rounded-lg border border-white/15 bg-black/50 px-2 text-sm font-normal normal-case tracking-normal text-zinc-100 outline-none focus:border-cyan-200/50"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyTextLink} className="inline-flex h-9 items-center rounded-full bg-cyan-300 px-3 text-xs font-semibold text-slate-950">Lien sur le texte</button>
            {!compact && (
              <button type="button" disabled={linkBusy} onMouseDown={(e) => e.preventDefault()} onClick={() => void applyLinkCard()} className="inline-flex h-9 items-center rounded-full border border-white/20 px-3 text-xs font-semibold text-white disabled:opacity-60">
                {linkBusy ? "Aperçu…" : "Bloc aperçu"}
              </button>
            )}
          </div>
          {linkError && <p className="text-[11px] font-normal normal-case tracking-normal text-rose-200">{linkError}</p>}
        </form>
      )}
    </div>
  );
}

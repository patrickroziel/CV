"use client";

import { AlignLeft, ArrowDown } from "lucide-react";
import { RichHtml } from "@/components/shared/RichHtml";

/**
 * An independent, keyboard-scrollable media card, not part of the article prose.
 * Legacy blocks remain plain text; opt-in rich blocks render sanitized HTML.
 */
export function ScrollableTextMedia({ title, body, format }: { title: string; body: string; format?: "rich" }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-2xl border border-cyan-200/25 bg-[rgba(5,25,33,0.95)] shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-100/15 bg-cyan-100/[0.055] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-200/10 text-cyan-100" aria-hidden="true">
            <AlignLeft className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100/60">Bloc de texte</span>
            <span className="block break-words text-sm font-semibold text-cyan-50">{title || "Extrait à lire"}</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-100/60">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> Faire défiler pour lire
        </span>
      </figcaption>
      <div
        role="region"
        tabIndex={0}
        aria-label={title ? `Lire le bloc de texte : ${title}` : "Lire le bloc de texte"}
        className="max-h-80 min-w-0 overflow-y-auto overscroll-contain px-4 py-5 text-[14px] leading-7 text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-200/70 sm:px-6 sm:text-[15px] [scrollbar-width:thin] [scrollbar-color:rgba(165,243,252,0.5)_transparent]"
        style={{ scrollbarGutter: "stable" }}
      >
        {format === "rich" ? (
          <RichHtml html={body} className="min-w-0 break-words text-inherit [&_p]:whitespace-pre-wrap" />
        ) : (
          <div className="whitespace-pre-wrap break-words">{body}</div>
        )}
      </div>
    </figure>
  );
}

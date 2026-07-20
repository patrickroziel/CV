"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  /** Compact: flag + short code only */
  compact?: boolean;
};

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = usePortfolio();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const meta = LOCALE_META[locale];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-white/20",
          "bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-50 shadow-lg backdrop-blur-xl",
          "transition hover:border-teal-300/50 hover:bg-teal-300/15 hover:text-teal-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
        )}
        aria-label={t("languageSwitcher.label")}
        aria-expanded={open}
      >
        <Languages className="h-4 w-4 shrink-0 text-teal-300" />
        <span className="text-base leading-none" aria-hidden>
          {meta.flag}
        </span>
        <span className="tracking-wide">
          {compact ? meta.short : meta.nativeName}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-400 transition",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[12.5rem] overflow-hidden rounded-2xl border border-white/18 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-2xl"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {t("languageSwitcher.label")}
          </p>
          {LOCALES.map((code: Locale) => {
            const m = LOCALE_META[code];
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-teal-300/20 text-teal-50 ring-1 ring-teal-300/30"
                    : "text-zinc-300 hover:bg-white/10 hover:text-zinc-50"
                )}
              >
                <span className="text-lg leading-none">{m.flag}</span>
                <span className="flex-1 font-medium">{m.nativeName}</span>
                <span className="text-[10px] font-bold text-zinc-500">
                  {m.short}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

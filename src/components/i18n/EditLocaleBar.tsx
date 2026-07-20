"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

/** Sticky bar in edit mode: pick which language you are filling in */
export function EditLocaleBar() {
  const { editMode, editingLocale, setEditingLocale, t } = usePortfolio();
  if (!editMode) return null;

  return (
    <div className="no-print border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-200/90">
          {t("edit.editingIn")}
        </span>
        <div className="flex flex-wrap gap-1">
          {LOCALES.map((code: Locale) => {
            const m = LOCALE_META[code];
            const active = code === editingLocale;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setEditingLocale(code)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  active
                    ? "border-amber-300/50 bg-amber-300/20 text-amber-50"
                    : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                )}
              >
                <span>{m.flag}</span>
                <span>{m.short}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-zinc-500 sm:ml-auto">
          {t("edit.fallbackHint")}
        </span>
      </div>
    </div>
  );
}

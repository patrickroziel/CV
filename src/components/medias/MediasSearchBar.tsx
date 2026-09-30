"use client";

import { FileText, ImageIcon, Search, Video, X } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassCard";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { MediasKindFilter } from "@/lib/medias-search";
import { cn } from "@/lib/utils";

type MediasSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  kind: MediasKindFilter;
  onKindChange: (kind: MediasKindFilter) => void;
};

const FILTERS: {
  id: MediasKindFilter;
  labelKey: string;
  icon: typeof Search;
}[] = [
  { id: "all", labelKey: "medias.filterAll", icon: Search },
  { id: "video", labelKey: "medias.filterVideos", icon: Video },
  { id: "document", labelKey: "medias.filterDocuments", icon: FileText },
  { id: "image", labelKey: "medias.filterImages", icon: ImageIcon },
];

export function MediasSearchBar({
  query,
  onQueryChange,
  kind,
  onKindChange,
}: MediasSearchBarProps) {
  const { t } = usePortfolio();

  return (
    <div className="mb-8 space-y-3">
      <GlassPanel className="border-violet-300/20 p-1.5 sm:p-2">
        <label className="relative flex min-h-12 items-center gap-2 px-2 sm:min-h-[52px] sm:px-3">
          <Search
            className="h-5 w-5 shrink-0 text-violet-300/90"
            aria-hidden
          />
          <span className="sr-only">{t("medias.searchLabel")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("medias.searchPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 outline-none sm:h-[44px] sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 text-zinc-200 transition hover:bg-white/15 sm:h-9 sm:w-9"
              aria-label={t("medias.searchClear")}
              title={t("medias.searchClear")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </GlassPanel>

      <div
        role="tablist"
        aria-label={t("medias.searchLabel")}
        className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map(({ id, labelKey, icon: Icon }) => {
          const active = kind === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onKindChange(id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition sm:h-9 sm:text-xs",
                active
                  ? "border-violet-300/40 bg-violet-300 text-zinc-950 shadow-md shadow-violet-300/20"
                  : "border-white/12 bg-black/25 text-zinc-300 backdrop-blur-xl hover:border-white/20 hover:bg-white/10 hover:text-zinc-50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_NAV, NAV_ITEM_META } from "@/lib/types";

export function WorkSidebar() {
  const { data, l, t } = usePortfolio();

  const items = useMemo(() => {
    const nav = data.nav ?? DEFAULT_NAV;
    return NAV_ITEM_META.filter((meta) => {
      if (!meta.sectionId) return false;
      if (meta.showInNav === false) return false;
      const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
      return cfg?.visible !== false;
    }).map((meta) => {
      const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
      return {
        id: meta.id,
        href: meta.href,
        label: l(cfg.label).trim() || t(meta.i18nKey),
      };
    });
  }, [data.nav, l, t]);

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-[rgba(4,16,20,0.82)] p-3.5 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <p className="mb-2.5 px-2 text-[9px] font-medium uppercase tracking-[0.26em] text-zinc-400">
        Parcourir
      </p>

      <nav
        aria-label="Navigation Work"
        className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex shrink-0 items-center rounded-xl px-2.5 py-2 text-[0.78rem] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:w-full"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

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
    <div className="mb-10 overflow-x-auto pb-2 sm:mb-12">
      <nav
        aria-label="Navigation Work"
        className="inline-flex min-w-max items-center gap-1 rounded-2xl border border-cyan-100/10 bg-[#06171b]/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="shrink-0 rounded-xl px-3.5 py-2 text-sm text-zinc-400 transition hover:bg-cyan-100/[0.08] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

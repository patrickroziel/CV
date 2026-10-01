"use client";

import { useMemo, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_NAV, NAV_ITEM_META } from "@/lib/types";
import { stripHtml } from "@/lib/sanitize-html";

function sortExperiences<T extends { startDate: string; endDate?: string | null }>(list: T[]) {
  return [...list].sort((a, b) => {
    const aEnd = a.endDate ?? "9999-12";
    const bEnd = b.endDate ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.startDate.localeCompare(a.startDate);
  });
}

function cleanRoleLabel(value: string) {
  return stripHtml(value).replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

export function WorkSidebar() {
  const { data, l, t } = usePortfolio();
  const [experienceMenuOpen, setExperienceMenuOpen] = useState(false);

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

  const experienceItems = useMemo(
    () =>
      sortExperiences(data.experiences).map((exp) => ({
        id: exp.id,
        href: `#experience-${exp.id}`,
        label: cleanRoleLabel(l(exp.role)),
      })),
    [data.experiences, l]
  );

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-[rgba(4,16,20,0.82)] p-3.5 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <p className="mb-2.5 px-2 text-[9px] font-medium uppercase tracking-[0.26em] text-zinc-400">
        Parcourir
      </p>

      <nav
        aria-label="Navigation Work"
        className="flex gap-1 overflow-x-auto pb-1 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0"
      >
        {items.map((item) => {
          if (item.id !== "experience") {
            return (
              <a
                key={item.id}
                href={item.href}
                className="flex shrink-0 items-center rounded-xl px-2.5 py-2 text-[0.78rem] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:w-full"
              >
                {item.label}
              </a>
            );
          }

          return (
            <div
              key={item.id}
              className="shrink-0 lg:w-full"
              onMouseEnter={() => setExperienceMenuOpen(true)}
              onMouseLeave={() => setExperienceMenuOpen(false)}
              onFocus={() => setExperienceMenuOpen(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setExperienceMenuOpen(false);
                }
              }}
            >
              <a
                href={item.href}
                className="flex items-center rounded-xl px-2.5 py-2 text-[0.78rem] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:w-full"
              >
                {item.label}
              </a>

              <div
                className={`hidden overflow-hidden pl-2 transition-all duration-200 lg:block ${
                  experienceMenuOpen
                    ? "max-h-[28rem] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-2 border-l border-white/10 py-1 pl-2">
                  {experienceItems.map((exp) => (
                    <a
                      key={exp.id}
                      href={exp.href}
                      className="block rounded-lg px-2 py-1.5 text-[0.68rem] leading-snug text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                    >
                      {exp.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

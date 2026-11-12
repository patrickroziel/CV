"use client";

import { useMemo, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { WorkShare } from "@/components/work/WorkShare";
import { Briefcase, Clapperboard, GraduationCap, Languages, LayoutGrid, Mail, Quote, Sparkles } from "lucide-react";
import { DEFAULT_NAV, NAV_ITEM_META, type NavItemId } from "@/lib/types";
import { stripHtml } from "@/lib/sanitize-html";

function sortExperiences<T extends { startDate: string; endDate?: string | null }>(list: T[]) {
  return [...list].sort((a, b) => {
    const aEnd = a.endDate ?? "9999-12";
    const bEnd = b.endDate ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.startDate.localeCompare(a.startDate);
  });
}

const NAV_ICONS: Record<NavItemId, typeof Mail> = {
  home: Clapperboard,
  experience: Briefcase,
  projects: LayoutGrid,
  skills: Sparkles,
  education: GraduationCap,
  languages: Languages,
  quotes: Quote,
  contact: Mail,
  gallery: LayoutGrid,
};

function NavLabel({ id, label }: { id: NavItemId; label: string }) {
  const Icon = NAV_ICONS[id];
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="truncate">{label}</span>
    </span>
  );
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
        href: meta.href.startsWith("/#") ? `/work${meta.href.slice(1)}` : meta.href.startsWith("#") ? `/work${meta.href}` : meta.href,
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

  const bio = stripHtml(l(data.profile?.bio ?? "")).replace(/\s+/g, " ").trim();
  const row = "flex shrink-0 items-center rounded-xl px-2.5 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 md:w-full";

  return (
    <div>
      <p className="text-xs text-white/75">Patrick Roziel</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Work</h1>
      {bio ? (
        <p className="mt-2 max-w-full text-[13px] leading-5 text-white/80">{bio}</p>
      ) : null}
      <div className="mt-3">
        <WorkShare pill />
      </div>

      <nav
        aria-label="Navigation Work"
        className="mt-3 flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 md:block md:space-y-0.5 md:overflow-visible md:pb-0"
      >
        {items.map((item) => {
          if (item.id !== "experience") {
            return (
              <a key={item.id} href={item.href} className={row}>
                <NavLabel id={item.id} label={item.label} />
              </a>
            );
          }

          return (
            <div
              key={item.id}
              className="shrink-0 md:w-full"
              onMouseEnter={() => setExperienceMenuOpen(true)}
              onMouseLeave={() => setExperienceMenuOpen(false)}
              onFocus={() => setExperienceMenuOpen(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setExperienceMenuOpen(false);
                }
              }}
            >
              <a href={item.href} className={row}>
                <NavLabel id={item.id} label={item.label} />
              </a>

              <div
                className={`hidden overflow-hidden pl-2 transition-all duration-200 md:block ${
                  experienceMenuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="ml-2 border-l border-white/10 py-1 pl-2">
                  {experienceItems.map((exp) => (
                    <a
                      key={exp.id}
                      href={exp.href}
                      className="block rounded-lg px-2 py-1.5 text-[0.68rem] leading-snug text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
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

"use client";

import { useMemo, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { WorkShare } from "@/components/work/WorkShare";
import { Briefcase, Clapperboard, GraduationCap, Languages, LayoutGrid, Mail, Quote, Sparkles } from "lucide-react";
import { DEFAULT_NAV, NAV_ITEM_META, type NavItemId } from "@/lib/types";
import { stripHtml } from "@/lib/sanitize-html";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { TipsLink } from "@/components/layout/SupportBar";

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
  return (
    <div>
      <div className="flex items-start justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-white">Work</h1>
          <p className="mt-1 text-xs leading-snug text-white/70">Portfolio, parcours et compétences.</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <TipsLink compact />
          <WorkShare pill />
        </div>
      </div>
      <div className="hidden md:block">
        <SectionHeading title="Work">Portfolio, parcours et compétences.</SectionHeading>
        <div className="mt-3">
          <WorkShare pill />
        </div>
      </div>
    </div>
  );
}

export function WorkMenu() {
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

  return (
    <div onMouseLeave={() => setExperienceMenuOpen(false)}>
      <nav aria-label="Navigation Work" className="section-menu-bar">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            onMouseEnter={() => setExperienceMenuOpen(item.id === "experience")}
            onFocus={() => setExperienceMenuOpen(item.id === "experience")}
          >
            <NavLabel id={item.id} label={item.label} />
          </a>
        ))}
      </nav>
      {experienceMenuOpen && experienceItems.length > 0 ? (
        <div className="mt-2 flex gap-1 overflow-x-auto px-1">
          {experienceItems.map((exp) => (
            <a
              key={exp.id}
              href={exp.href}
              className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75 hover:text-white"
            >
              {exp.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

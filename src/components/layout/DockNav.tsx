"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  FolderOpen,
  GraduationCap,
  Home,
  Languages,
  Mail,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { GlassPanel } from "@/components/glass/GlassCard";
import {
  DEFAULT_NAV,
  NAV_ITEM_META,
  type NavItemId,
} from "@/lib/types";

const ICONS: Record<NavItemId, LucideIcon> = {
  home: Home,
  experience: Briefcase,
  projects: FolderOpen,
  skills: Sparkles,
  education: GraduationCap,
  languages: Languages,
  quotes: Sparkles,
  contact: Mail,
  gallery: FolderOpen,
};

export function DockNav() {
  const { data, editMode, isHydrated, t, l } = usePortfolio();
  const [hover, setHover] = useState<number | null>(null);

  const items = useMemo(() => {
    const nav = data.nav ?? DEFAULT_NAV;
    return NAV_ITEM_META.filter((meta) => {
      if (meta.showInNav === false) return false;
      const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
      return cfg?.visible !== false;
    }).map((meta) => {
      const cfg = nav[meta.id] ?? DEFAULT_NAV[meta.id];
      const custom = l(cfg.label).trim();
      return {
        ...meta,
        label: custom || t(meta.i18nKey),
        Icon: ICONS[meta.id],
      };
    });
  }, [data.nav, l, t]);

  if (!isHydrated || !data.ui.showDock || editMode) return null;

  const sectionItems = items.filter((i) => i.id !== "gallery");
  const gallery = items.find((i) => i.id === "gallery");

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-5 z-30 hidden justify-center lg:flex">
      <GlassPanel className="pointer-events-auto flex items-end gap-1 px-3 py-2 shadow-2xl">
        {sectionItems.map((item, i) => {
          const Icon = item.Icon;
          const dist = hover === null ? 0 : Math.abs(hover - i);
          const scale =
            hover === null ? 1 : dist === 0 ? 1.35 : dist === 1 ? 1.15 : 1;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "glass-chip group relative flex h-12 w-12 items-center justify-center rounded-2xl text-zinc-200 transition-transform duration-150 hover:border-teal-300/45 hover:bg-teal-300/15 hover:text-teal-100"
              )}
              style={{ transform: `scale(${scale})`, transformOrigin: "bottom" }}
            >
              <Icon className="h-5 w-5" />
              <span className="glass-chip pointer-events-none absolute -top-9 rounded-lg px-2 py-0.5 text-[10px] text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
        {gallery && (
          <>
            <div className="mx-1 h-10 w-px bg-white/20" />
            <Link
              href={gallery.href}
              title={gallery.label}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/12 text-amber-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-md transition hover:bg-amber-400/22"
            >
              <FolderOpen className="h-5 w-5" />
            </Link>
          </>
        )}
      </GlassPanel>
    </div>
  );
}

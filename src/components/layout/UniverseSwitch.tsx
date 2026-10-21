"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Cloud, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { universeFromPath, type SiteUniverse } from "@/lib/universe";

export function useUniverse(): SiteUniverse {
  return universeFromPath(usePathname());
}

export function UniverseSwitch({ className }: { className?: string }) {
  const active = useUniverse();
  return <nav aria-label="Les trois univers" className={cn(
    "inline-flex shrink-0 items-center rounded-full border border-cyan-300/20 bg-cyan-100/[0.05] p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-xl",
    className,
  )}>
    {([
      { href: "/", label: "Notes", key: "medias" as const, icon: Radio, hint: "Écrits, images et musiques" },
      { href: "/air", label: "Air", key: "air" as const, icon: Cloud, hint: "Décryptages, expériences et observations" },
      { href: "/work", label: "Work", key: "portfolio" as const, icon: Clapperboard, hint: "Portfolio, CV et compétences" },
    ]).map(({ href, label, key, icon: Icon, hint }) =>
      <Link key={key} href={href} title={hint} aria-current={active === key ? "page" : undefined}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide transition sm:gap-1.5 sm:px-3 sm:text-xs",
          active === key ? "bg-cyan-200 text-zinc-950 shadow-md shadow-cyan-300/25" : "text-zinc-400 hover:bg-white/10 hover:text-zinc-100",
        )}>
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" /><span>{label}</span>
      </Link>
    )}
  </nav>;
}

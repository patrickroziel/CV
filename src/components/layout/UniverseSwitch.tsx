"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { universeFromPath, type SiteUniverse } from "@/lib/universe";

export function useUniverse(): SiteUniverse {
  return universeFromPath(usePathname());
}

/**
 * Top-level universe toggle — always visible so visitors know
 * whether they are in Work or Notes.
 */
export function UniverseSwitch({ className }: { className?: string }) {
  const universe = useUniverse();
  return (
    <nav
      aria-label="Work / Notes"
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border p-0.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-xl",
        "border-cyan-300/20 bg-cyan-100/[0.05]",
        className
      )}
    >
      <UniverseTab
        href="/"
        active={universe === "portfolio"}
        universe="portfolio"
        label="Work"
        hint="Portfolio professionnel"
        icon={Clapperboard}
      />
      <UniverseTab
        href="/notes"
        active={universe === "medias"}
        universe="medias"
        label="Notes"
        hint="Livre, réflexions, documents, images et vidéos"
        icon={Radio}
      />
    </nav>
  );
}

function UniverseTab({
  href,
  active,
  universe,
  label,
  hint,
  icon: Icon,
}: {
  href: string;
  active: boolean;
  universe: SiteUniverse;
  label: string;
  hint: string;
  icon: typeof Clapperboard;
}) {
  return (
    <Link
      href={href}
      title={hint}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition sm:px-3 sm:text-xs",
        active && universe === "portfolio" &&
          "bg-cyan-200 text-zinc-950 shadow-md shadow-cyan-300/25",
        active && universe === "medias" &&
          "bg-cyan-200 text-zinc-950 shadow-md shadow-cyan-300/25",
        !active &&
          "text-zinc-400 hover:bg-white/8 hover:text-zinc-100"
      )}
    >
      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      <span>{label}</span>
      {active && (
        <span className="sr-only"> — page active</span>
      )}
    </Link>
  );
}

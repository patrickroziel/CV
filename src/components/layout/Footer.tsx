"use client";

import Link from "next/link";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useUniverse } from "@/components/layout/UniverseSwitch";
import { ContactButton } from "@/components/layout/ContactButton";
import { cn } from "@/lib/utils";

export function Footer() {
  const { data, resetToDefaults, editMode } = usePortfolio();
  const universe = useUniverse();
  const year = new Date().getFullYear();
  const name =
    data.profile.name.replace(/<[^>]+>/g, "").trim() || data.profile.name;

  const links = [
    { href: "/air", label: "Air" },
    { href: "/notes", label: "Notes" },
    { href: "/work", label: "Work" },
    { href: "/projets", label: "Projets" },
  ];

  return (
    <footer
      className={cn(
        "no-print relative z-10 border-t border-white/12 bg-gradient-to-t from-black/40 to-transparent pt-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        universe === "medias"
          ? "pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]"
          : "pb-[calc(9.75rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(8.75rem+env(safe-area-inset-bottom,0px))]"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6">
        <nav aria-label="Liens principaux" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-400">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-teal-300"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/plan-du-site" className="transition hover:text-teal-300">
            Plan du site
          </Link>
        </nav>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ContactButton />
          <p className="text-xs text-zinc-500">
            © {year} {name}
            {universe === "medias" ? " · Notes" : universe === "air" ? " · Air" : " · Work"}
          </p>
        </div>

        {editMode && (
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Réinitialiser toutes les données avec le profil ATS par défaut ?"
                )
              ) {
                resetToDefaults();
              }
            }}
            className="text-left text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            Réinitialiser les données
          </button>
        )}
      </div>
    </footer>
  );
}

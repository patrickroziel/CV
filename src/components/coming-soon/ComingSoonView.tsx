"use client";

import { motion } from "framer-motion";
import { Eye, Pencil } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { ShowreelEmbed } from "@/components/shared/ShowreelEmbed";
import { GlassCard } from "@/components/glass/GlassCard";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { DEFAULT_COMING_SOON } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Public landing when Coming Soon is enabled:
 * wallpaper (layout) + optional title + showreel.
 */
export function ComingSoonView() {
  const { data, l, editAllowed, setEditMode, t } = usePortfolio();
  const cfg = data.comingSoon ?? DEFAULT_COMING_SOON;
  const title =
    l(cfg.title).trim() ||
    l(DEFAULT_COMING_SOON.title).trim() ||
    "Coming soon";

  return (
    <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:py-20">
      {/* Minimal chrome for editors + language for visitors */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-end gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/12 bg-black/40 p-1.5 shadow-lg backdrop-blur-xl">
          <LanguageSwitcher compact />
          {editAllowed && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => setEditMode(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("actions.edit")}</span>
            </Button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl"
      >
        <GlassCard
          elevated
          className={cn(
            "relative overflow-hidden p-5 sm:p-8 md:p-10",
            "border-white/15"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-teal-400/10 via-transparent to-amber-400/10"
            aria-hidden
          />
          <div className="relative z-[1] space-y-8 sm:space-y-10">
            <header className="text-center">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-300/90">
                Patrick Roziel
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:text-5xl">
                {title}
              </h1>
            </header>

            {/* Showreel (same editor as full site) */}
            <ShowreelEmbed />
          </div>
        </GlassCard>

        {editAllowed && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-500">
            <Eye className="h-3.5 w-3.5" />
            Vue publique — activez le Mode Édition pour le site complet
          </p>
        )}
      </motion.div>
    </main>
  );
}

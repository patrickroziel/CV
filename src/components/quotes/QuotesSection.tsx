"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Film,
  Layers,
  Settings2,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { EditGate } from "@/components/shared/EditGate";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { QuotesSettingsPanel } from "@/components/quotes/QuotesSettingsPanel";
import { DEFAULT_QUOTES, type QuoteServiceId } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<QuoteServiceId, LucideIcon> = {
  montage: Film,
  motion: Sparkles,
  social: Clapperboard,
  captation: Video,
  pack: Layers,
};

export function QuotesSection() {
  const { data, editMode, l, t } = usePortfolio();
  const quotes = data.quotes ?? DEFAULT_QUOTES;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const visible = quotes.services.filter((s) => s.show || editMode);
  if (visible.length === 0 && !editMode) return null;

  return (
    <section id="devis" className="relative z-10 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={l(quotes.sectionEyebrow)}
          title={l(quotes.sectionTitle)}
          description={l(quotes.sectionDescription)}
          action={
            <EditGate>
              <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
                {t("quotes.configure")}
              </Button>
            </EditGate>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4"
        >
          {/*
            Mobile: wrap (2 lines ok). Desktop (md+): single row.
            Each button keeps glass styling; no outer card.
          */}
          <div className="flex w-full flex-wrap justify-center gap-2 sm:gap-3 md:flex-nowrap md:gap-3">
            {visible.map((service) => {
              const Icon = ICONS[service.id] ?? Film;
              const hidden = !service.show && editMode;
              return (
                <MagneticButton key={service.id} className="md:min-w-0 md:flex-1">
                  <Button
                    size="lg"
                    variant="secondary"
                    className={cn(
                      "glass-chip h-auto min-h-11 w-full max-w-full whitespace-normal px-3 py-3 text-left sm:px-4",
                      "border-white/16 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]",
                      "md:whitespace-nowrap",
                      hidden && "opacity-50 ring-1 ring-amber-400/30"
                    )}
                    asChild
                  >
                    <Link href={`/devis/${service.id}`}>
                      <Icon className="h-4 w-4 shrink-0 text-teal-300" />
                      <span className="text-sm font-medium leading-snug">
                        {l(service.buttonLabel)}
                      </span>
                      {hidden && (
                        <span className="text-[10px] text-amber-300/90">
                          (masqué)
                        </span>
                      )}
                    </Link>
                  </Button>
                </MagneticButton>
              );
            })}
          </div>
          {editMode && (
            <p className="text-center text-xs text-zinc-500">
              {t("quotes.editHint")}
            </p>
          )}
        </motion.div>
      </div>

      <QuotesSettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { GlassPanel } from "@/components/glass/GlassCard";
import { SkillTag } from "@/components/skills/SkillTag";
import { RichHtml } from "@/components/shared/RichHtml";
import { QuickContactIconView } from "@/components/widgets/widget-icons";
import { XFeedWidget } from "@/components/widgets/XFeedWidget";

export function WidgetStack() {
  const { data, isHydrated, l } = usePortfolio();
  if (!isHydrated) return null;

  const { profile, contact: c } = data;
  const links = c.quickContactLinks ?? [];
  const tags = c.widgetSkillTags ?? [];

  const showAny =
    c.showWidgetQuickContact ||
    c.showWidgetSkills ||
    c.showWidgetAvailability ||
    c.showWidgetXFeed;
  if (!showAny) return null;

  return (
    <div className="no-print pointer-events-none fixed right-4 top-28 z-20 hidden w-64 max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pb-8 xl:flex">
      {c.showWidgetQuickContact && links.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="pointer-events-auto"
        >
          <GlassPanel className="p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {l(c.widgetQuickContactTitle)}
            </p>
            <div className="flex flex-col gap-2">
              {links.map((link) => {
                const external =
                  link.href.startsWith("http://") ||
                  link.href.startsWith("https://");
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10 hover:text-teal-200"
                  >
                    <QuickContactIconView
                      name={link.icon}
                      className="h-3.5 w-3.5 shrink-0 text-teal-300"
                    />
                    <span className="truncate">{l(link.label)}</span>
                  </a>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {c.showWidgetSkills && tags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="pointer-events-auto"
        >
          <GlassPanel className="p-4">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              <Sparkles className="h-3 w-3 text-amber-400" />
              {l(c.widgetSkillsTitle)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <SkillTag
                  key={tag}
                  label={tag}
                  variant="secondary"
                  className="text-[10px]"
                />
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      {c.showWidgetAvailability && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="pointer-events-auto"
        >
          <GlassPanel className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {l(c.widgetAvailabilityTitle)}
            </p>
            <RichHtml
              html={l(c.widgetAvailabilityText)}
              className="mt-2 text-sm font-medium text-teal-200"
            />
            {c.showLocation && (
              <p className="mt-1 text-xs text-zinc-500">{l(profile.location)}</p>
            )}
          </GlassPanel>
        </motion.div>
      )}

      {c.showWidgetXFeed && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="pointer-events-auto shrink-0"
        >
          <XFeedWidget
            username={c.xUsername || c.xProfileUrl || ""}
            title={l(c.widgetXFeedTitle) || "Sur X"}
            profileUrl={c.xProfileUrl}
          />
        </motion.div>
      )}
    </div>
  );
}

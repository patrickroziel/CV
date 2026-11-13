"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AirIcon, WaterIcon, WoodIcon } from "@/components/layout/universe-icons";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "universes-banner-dismissed";

const items = [
  {
    href: "/notes",
    label: "Notes",
    hint: "écrits",
    icon: WaterIcon,
    accent: "text-cyan-200/90",
  },
  {
    href: "/air",
    label: "Air",
    hint: "décryptages",
    icon: AirIcon,
    accent: "text-teal-200/90",
  },
  {
    href: "/work",
    label: "Work",
    hint: "portfolio",
    icon: WoodIcon,
    accent: "text-amber-200/90",
  },
];

export function UniversesBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function trackClick(label: string) {
    track("banner_universe_click", { universe: label });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="no-print pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-3 pt-2.5 sm:px-5"
        >
          <div
            className={cn(
              "pointer-events-auto relative flex max-w-2xl items-center overflow-hidden rounded-full",
              "border border-white/[0.08] bg-[#020c10]/50 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]",
              "backdrop-blur-2xl supports-[backdrop-filter]:bg-[#020c10]/40",
              "px-1.5 py-1 sm:px-2 sm:py-1.5"
            )}
          >
            {/* Filet doré ultra-fin */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(214,186,140,0.1) 20%, rgba(231,211,174,0.55) 50%, rgba(214,186,140,0.1) 80%, transparent 100%)",
              }}
            />

            {/* Sheen très discret */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                background:
                  "linear-gradient(100deg, transparent 35%, rgba(255,248,236,0.05) 50%, transparent 65%)",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 6,
              }}
            />

            <div className="relative flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <span key={item.href} className="flex items-center">
                    {i > 0 && (
                      <span className="mx-1 h-3 w-px bg-white/10 sm:mx-1.5" aria-hidden />
                    )}
                    <Link
                      href={item.href}
                      title={item.hint}
                      onClick={() => trackClick(item.label)}
                      className="group flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-all duration-200 hover:bg-white/[0.06] sm:px-3"
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0 opacity-80", item.accent)} />
                      <span className="text-[12px] font-medium tracking-tight text-zinc-100 sm:text-[13px]">
                        {item.label}
                      </span>
                      <span className="hidden text-[11px] font-normal tracking-tight text-zinc-500/90 transition group-hover:text-zinc-300 xl:inline">
                        {item.hint}
                      </span>
                    </Link>
                  </span>
                );
              })}
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer la bannière"
              className="relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-500/80 transition hover:bg-white/8 hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

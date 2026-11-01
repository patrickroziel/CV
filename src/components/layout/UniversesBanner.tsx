"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Clapperboard, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "universes-banner-dismissed";

const items = [
  {
    href: "/notes",
    label: "Notes",
    hint: "Écrits, musiques et fragments",
    icon: Radio,
    accent: "text-cyan-200",
  },
  {
    href: "/air",
    label: "Air",
    hint: "Décryptages et observations",
    icon: Cloud,
    accent: "text-teal-200",
  },
  {
    href: "/work",
    label: "Work",
    hint: "Portfolio & compétences",
    icon: Clapperboard,
    accent: "text-amber-200",
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

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="no-print pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-3 pt-2 sm:px-4"
        >
          <div
            className={cn(
              "pointer-events-auto relative flex max-w-3xl items-center gap-3 overflow-hidden rounded-2xl border border-white/12 px-3.5 py-2 shadow-2xl",
              "bg-[#031014]/55 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#031014]/40",
              "sm:gap-4 sm:px-4 sm:py-2.5"
            )}
          >
            {/* Subtle animated sheen */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.08) 48%, rgba(142,240,234,0.12) 52%, transparent 70%)",
              }}
              animate={{ x: ["-120%", "120%"] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 4,
              }}
            />

            <p className="relative hidden text-[11px] font-medium tracking-wide text-zinc-400 sm:block">
              Trois univers
            </p>

            <div className="relative flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <span key={item.href} className="flex items-center gap-1 sm:gap-2">
                    {i > 0 && (
                      <span className="text-zinc-600 text-[10px] sm:text-xs">·</span>
                    )}
                    <Link
                      href={item.href}
                      title={item.hint}
                      className="group flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-white/8"
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", item.accent)} />
                      <span className="text-xs font-medium text-zinc-100 sm:text-[13px]">
                        {item.label}
                      </span>
                      <span className="hidden text-[11px] text-zinc-500 group-hover:text-zinc-300 lg:inline">
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
              className="relative ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

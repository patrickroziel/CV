"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LanguageIconItem } from "@/lib/types";
import { filterIconsToRegions, REGION_PATHS } from "@/lib/language-regions";
import {
  CountryEmblemIcon,
  CountryFlagIcon,
  emblemCount,
} from "@/components/languages/country-icons";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE_S = 0.75;

function renderIconContent(icon: LanguageIconItem): React.ReactNode {
  const region = (icon.region || "FR").toUpperCase();

  if (icon.kind === "upload" && icon.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon.src} alt="" className="h-7 w-7 object-contain" />
    );
  }

  if (icon.kind === "flag") {
    return (
      <CountryFlagIcon code={region} className="h-5 w-7 rounded-sm shadow-sm" />
    );
  }

  if (icon.kind === "monument") {
    return <CountryEmblemIcon code={region} variant={0} className="h-7 w-7" />;
  }

  if (icon.kind === "culture") {
    const v = Math.min(1, emblemCount(region) - 1);
    return (
      <CountryEmblemIcon code={region} variant={v} className="h-7 w-7" />
    );
  }

  const path = REGION_PATHS[region];
  if (!path) {
    return <CountryFlagIcon code={region} className="h-5 w-7" />;
  }
  return (
    <svg viewBox="0 0 100 100" className="h-7 w-7 overflow-visible" fill="none">
      <path
        d={path}
        className="stroke-amber-400/90"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(245,158,11,0.45))" }}
      />
    </svg>
  );
}

type LanguageIconCarouselProps = {
  icons: LanguageIconItem[];
  allowedRegions?: string[];
  languageName: string;
  className?: string;
  /** Cross-fade interval (default 2s) */
  intervalMs?: number;
};

/**
 * Premium Framer Motion icon carousel — soft cross-fade every ~2s.
 * Uses AnimatePresence with overlapping exit/enter for a true fondu.
 */
export function LanguageIconCarousel({
  icons,
  allowedRegions,
  languageName,
  className,
  intervalMs = 2000,
}: LanguageIconCarouselProps) {
  const reduce = useReducedMotion();

  const list = useMemo(() => {
    const allowed =
      allowedRegions && allowedRegions.length > 0
        ? allowedRegions
        : icons.map((i) => i.region).filter((r): r is string => Boolean(r));

    let filtered = filterIconsToRegions(icons || [], allowed);
    if (filtered.length === 0 && allowed.length > 0) {
      filtered = allowed.flatMap((code) => [
        { id: `auto-flag-${code}`, kind: "flag" as const, region: code },
        { id: `auto-mon-${code}`, kind: "monument" as const, region: code },
      ]);
    }
    if (filtered.length === 0) {
      return [{ id: "fallback", kind: "flag" as const, region: "FR" }];
    }
    return filtered;
  }, [icons, allowedRegions, languageName]);

  const [index, setIndex] = useState(0);
  const listKey = list.map((i) => i.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [listKey]);

  useEffect(() => {
    if (list.length <= 1 || reduce) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [list.length, intervalMs, reduce]);

  const current = list[index % list.length];

  return (
    <motion.span
      layout
      animate={{
        borderColor:
          current.kind === "outline"
            ? "rgba(251, 191, 36, 0.28)"
            : "rgba(255, 255, 255, 0.12)",
        backgroundColor:
          current.kind === "outline"
            ? "rgba(251, 191, 36, 0.1)"
            : "rgba(0, 0, 0, 0.4)",
        boxShadow:
          current.kind === "outline"
            ? "0 8px 24px -8px rgba(245,158,11,0.35)"
            : "0 10px 24px -10px rgba(0,0,0,0.55)",
      }}
      transition={{ duration: 0.55, ease: EASE }}
      className={cn(
        "relative z-20 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border backdrop-blur-md",
        className
      )}
    >
      {/* Overlapping cross-fade (no mode="wait") for a soft fondu */}
      <AnimatePresence initial={false}>
        <motion.span
          key={current.id}
          initial={
            reduce
              ? { opacity: 1 }
              : { opacity: 0, scale: 0.88, filter: "blur(6px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.06, filter: "blur(5px)" }
          }
          transition={{
            duration: reduce ? 0.01 : FADE_S,
            ease: EASE,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {renderIconContent(current)}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

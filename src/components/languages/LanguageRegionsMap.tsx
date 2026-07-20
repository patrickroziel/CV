"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import type { LanguageOutline } from "@/lib/types";
import { DEFAULT_OUTLINE_COLOR } from "@/lib/types";
import {
  extractSvgPathD,
  REGION_LABELS,
  REGION_PATHS,
  regionFlag,
} from "@/lib/language-regions";
import { getL } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

export type ResolvedOutline = {
  id: string;
  label: string;
  pathD: string;
  color: string;
  code?: string;
  flag?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const DRAW_S = 3.2;
const HOLD_MS = 1100;
const SPARKLE_COUNT = 6;

export function resolveOutlines(
  outlines: LanguageOutline[]
): ResolvedOutline[] {
  const result: ResolvedOutline[] = [];
  outlines.forEach((o, i) => {
    let pathD: string | null = null;
    if (o.customSvg) pathD = extractSvgPathD(o.customSvg);
    if (!pathD && o.code) pathD = REGION_PATHS[o.code.toUpperCase()] ?? null;
    if (!pathD) return;
    const code = o.code?.toUpperCase();
    result.push({
      id: o.id || `ol-${i}`,
      label:
        getL(o.label) || (code ? REGION_LABELS[code] || code : "Région"),
      pathD,
      color: o.color || DEFAULT_OUTLINE_COLOR,
      code,
      flag: code ? regionFlag(code) : undefined,
    });
  });
  return result;
}

type LanguageRegionsMapProps = {
  outlines: LanguageOutline[];
  regions?: string[];
  className?: string;
  active?: boolean;
  onActiveIdChange?: (id: string | null) => void;
};

/**
 * Full Framer Motion country outline cycle (one at a time).
 * `animate(pathLength)` draws the stroke; sparkles trail the pen head.
 */
export function LanguageRegionsMap({
  outlines,
  regions,
  className,
  active = true,
  onActiveIdChange,
}: LanguageRegionsMapProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const items = useMemo(() => {
    if (outlines?.length) return resolveOutlines(outlines);
    const legacy = (regions || []).map((code, i) => ({
      id: `legacy-${code}-${i}`,
      code,
      label: REGION_LABELS[code] || code,
    }));
    return resolveOutlines(legacy);
  }, [outlines, regions]);

  const itemsKey = items.map((i) => i.id).join("|");

  useEffect(() => {
    if (!active || items.length === 0) {
      onActiveIdChange?.(null);
      return;
    }
    onActiveIdChange?.(items[index % items.length]?.id ?? null);
  }, [active, index, items, onActiveIdChange]);

  useEffect(() => {
    if (!active) return;
    setIndex(0);
  }, [active, itemsKey]);

  if (items.length === 0) return null;

  const current = items[index % items.length];

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className
      )}
      initial={false}
      animate={{ opacity: active ? 1 : 0.28 }}
      transition={{ duration: 0.8, ease: EASE }}
      style={{ filter: "blur(0.35px)" }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-[-4%] h-[108%] w-[108%]"
      >
        <defs>
          <filter
            id={`fm-glow-${current.id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.45" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence mode="wait">
          {active && (
            <OutlineStroke
              key={current.id}
              item={current}
              reduceMotion={!!reduceMotion}
              filterId={`fm-glow-${current.id}`}
              onCycleComplete={() => {
                setIndex((i) => (i + 1) % items.length);
              }}
            />
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
}

function OutlineStroke({
  item,
  reduceMotion,
  filterId,
  onCycleComplete,
}: {
  item: ResolvedOutline;
  reduceMotion: boolean;
  filterId: string;
  onCycleComplete: () => void;
}) {
  const measureRef = useRef<SVGPathElement>(null);
  const pathLength = useMotionValue(reduceMotion ? 1 : 0);
  const [sparkles, setSparkles] = useState<
    { x: number; y: number; id: number; o: number }[]
  >([]);
  const [wick, setWick] = useState<{ x: number; y: number } | null>(null);
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    pathLength.set(reduceMotion ? 1 : 0);
    setSparkles([]);
    setWick(null);

    if (reduceMotion) {
      const t = window.setTimeout(onCycleComplete, HOLD_MS);
      return () => window.clearTimeout(t);
    }

    const controls = animate(pathLength, 1, {
      duration: DRAW_S,
      ease: EASE,
      onComplete: () => {
        if (done.current) return;
        done.current = true;
        window.setTimeout(onCycleComplete, HOLD_MS);
      },
    });
    return () => controls.stop();
  }, [item.id, pathLength, reduceMotion, onCycleComplete]);

  useMotionValueEvent(pathLength, "change", (v) => {
    const path = measureRef.current;
    if (!path || reduceMotion) return;
    try {
      const len = path.getTotalLength();
      if (!len) return;
      const head = path.getPointAtLength(v * len);
      setWick(v > 0.02 && v < 0.995 ? { x: head.x, y: head.y } : null);

      const pts: { x: number; y: number; id: number; o: number }[] = [];
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        const t = Math.max(0, v - (i + 1) * (0.035 + (i % 2) * 0.012));
        const pt = path.getPointAtLength(t * len);
        pts.push({
          x: pt.x,
          y: pt.y,
          id: i,
          o: Math.max(0.12, 0.88 - i * 0.11) * (0.5 + v * 0.5),
        });
      }
      setSparkles(pts);
    } catch {
      /* ignore */
    }
  });

  const color = item.color;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: EASE } }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {/* Measurement path (invisible) */}
      <path
        ref={measureRef}
        d={item.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth="0.4"
      />

      {/* Soft fill wash */}
      <motion.path
        d={item.pathD}
        fill={color}
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: 0.05 }}
        exit={{ fillOpacity: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        stroke="none"
      />

      {/* Ghost outline */}
      <path
        d={item.pathD}
        fill="none"
        stroke={color}
        strokeOpacity={0.1}
        strokeWidth="0.32"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Drawn stroke via Framer Motion pathLength */}
      <motion.path
        d={item.pathD}
        fill="none"
        stroke={color}
        strokeWidth="0.52"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        style={{ pathLength }}
      />

      <AnimatePresence>
        {wick && (
          <motion.g
            key="wick"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <circle
              cx={wick.x}
              cy={wick.y}
              r="1.45"
              fill={color}
              opacity={0.38}
              style={{ filter: "blur(1.6px)" }}
            />
            <circle
              cx={wick.x}
              cy={wick.y}
              r="0.55"
              fill="#fef3c7"
              opacity={0.96}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {sparkles.map((s) => (
        <motion.circle
          key={s.id}
          cx={s.x}
          cy={s.y}
          r={0.5 + (s.id % 3) * 0.1}
          fill="#fde68a"
          initial={false}
          animate={{ opacity: s.o, scale: 0.85 + s.o * 0.35 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 2.5px ${color})` }}
        />
      ))}
    </motion.g>
  );
}

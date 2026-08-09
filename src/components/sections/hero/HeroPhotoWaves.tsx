"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SOFT = "easeInOut" as const;

type HeroPhotoWavesProps = {
  /**
   * `photo` — centered on the profile photo only (default).
   * `card` — legacy full-card field (kept for compatibility).
   */
  mode?: "photo" | "card";
  className?: string;
};

/**
 * Cinematic energy field.
 * Default: sits behind the profile photo only (mode="photo").
 * No strokes / lines — soft glows, waves, plasma, particles.
 */
export function HeroPhotoWaves({
  mode = "photo",
  className,
}: HeroPhotoWavesProps) {
  const reduce = useReducedMotion();
  const photoMode = mode === "photo";

  if (reduce) {
    return (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-visible",
          className
        )}
      >
        <div className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        photoMode ? "overflow-visible" : "overflow-hidden rounded-[inherit]",
        className
      )}
    >
      {!photoMode && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400/7 via-violet-500/5 to-amber-400/6" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_45%,rgba(45,212,191,0.12)_0%,transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(167,139,250,0.09)_0%,transparent_50%)]" />
        </>
      )}

      {/* Wave origin: center of photo wrapper (or legacy card photo zone) */}
      <div
        className={
          photoMode
            ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            : [
                "absolute",
                "left-1/2 top-[9rem] -translate-x-1/2 -translate-y-1/2",
                "lg:left-[7.75rem] lg:top-1/2 lg:translate-x-0",
              ].join(" ")
        }
      >
        {/* Hot core — bright showreel-style pulse */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform sm:h-64 sm:w-64"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(94,234,212,0.55) 22%, rgba(167,139,250,0.28) 48%, transparent 70%)",
            filter: "blur(28px)",
          }}
          animate={{
            scale: [1, 1.18, 0.94, 1.12, 1],
            opacity: [0.7, 0.95, 0.72, 0.9, 0.7],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: SOFT }}
        />

        {/* Secondary magenta core for depth */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
          style={{
            background:
              "radial-gradient(circle, rgba(244,114,182,0.45) 0%, rgba(232,121,249,0.2) 45%, transparent 70%)",
            filter: "blur(24px)",
          }}
          animate={{
            scale: [1.05, 0.92, 1.15, 1, 1.05],
            opacity: [0.55, 0.8, 0.6, 0.75, 0.55],
            x: [0, 12, -8, 4, 0],
            y: [0, -10, 8, -4, 0],
          }}
          transition={{ duration: 7.5, repeat: Infinity, ease: SOFT, delay: 0.5 }}
        />

        {/* Expanding cinematic waves — high visibility, full-card reach */}
        {WAVES.map((w) => (
          <motion.div
            key={w.id}
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{
              width: w.base,
              height: w.base,
              marginLeft: -w.base / 2,
              marginTop: -w.base / 2,
              borderRadius: w.radius,
              background: w.gradient,
              filter: `blur(${w.blur}px)`,
            }}
            animate={{
              scale: w.scale,
              opacity: w.opacity,
              borderRadius: w.radiusKeyframes,
              rotate: w.rotate,
            }}
            transition={{
              duration: w.duration,
              repeat: Infinity,
              ease: SOFT,
              delay: w.delay,
            }}
          />
        ))}

        {/* Drifting plasma ribbons across the card */}
        {DRIFTS.map((d) => (
          <motion.div
            key={d.id}
            className="absolute left-1/2 top-1/2 will-change-transform"
            style={{
              width: d.size,
              height: d.size,
              marginLeft: -d.size / 2,
              marginTop: -d.size / 2,
              borderRadius: "50%",
              background: d.gradient,
              filter: `blur(${d.blur}px)`,
            }}
            animate={{
              x: d.x,
              y: d.y,
              scale: d.scale,
              opacity: d.opacity,
              borderRadius: d.radius,
            }}
            transition={{
              duration: d.duration,
              repeat: Infinity,
              ease: SOFT,
              delay: d.delay,
            }}
          />
        ))}

        {/* Soft glowing particles escaping the photo */}
        {PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            className="absolute left-1/2 top-1/2 block rounded-full will-change-transform"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: p.color,
              filter: `blur(${p.blur}px)`,
              boxShadow: `0 0 ${p.glow}px ${p.glowColor}`,
            }}
            animate={{
              x: p.x,
              y: p.y,
              scale: p.scale,
              opacity: p.opacity,
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: SOFT,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Sweeping light bands (rounded, heavily blurred — not hard lines) */}
      <motion.div
        className="absolute -left-1/4 top-[20%] h-24 w-[80%] rounded-full will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(94,234,212,0.22), rgba(255,255,255,0.12), transparent)",
          filter: "blur(28px)",
        }}
        animate={{
          x: ["-10%", "40%", "80%"],
          opacity: [0.2, 0.55, 0.2],
          y: [0, 20, -10],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: SOFT }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-[25%] h-20 w-[70%] rounded-full will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(167,139,250,0.2), rgba(251,191,36,0.14), transparent)",
          filter: "blur(32px)",
        }}
        animate={{
          x: ["20%", "-30%", "-60%"],
          opacity: [0.18, 0.48, 0.18],
          y: [0, -16, 8],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: SOFT, delay: 3 }}
      />

      {/* Corner depth glows */}
      <motion.div
        className="absolute -right-[10%] -top-[15%] h-[70%] w-[55%] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.28) 0%, rgba(167,139,250,0.12) 40%, transparent 68%)",
          filter: "blur(40px)",
        }}
        animate={{
          opacity: [0.45, 0.75, 0.5, 0.7, 0.45],
          scale: [1, 1.12, 0.96, 1.08, 1],
          x: [0, -24, 12, -16, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: SOFT }}
      />
      <motion.div
        className="absolute -bottom-[20%] left-[10%] h-[60%] w-[50%] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.22) 0%, rgba(244,114,182,0.12) 45%, transparent 70%)",
          filter: "blur(44px)",
        }}
        animate={{
          opacity: [0.4, 0.68, 0.45, 0.62, 0.4],
          scale: [1, 1.1, 0.95, 1.06, 1],
          x: [0, 20, -10, 14, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: SOFT, delay: 1.5 }}
      />
    </div>
  );
}

/** Expand-only; opacity floor matched at loop ends → no blink */
const WAVES: {
  id: number;
  base: number;
  blur: number;
  gradient: string;
  scale: number[];
  opacity: number[];
  radius: string;
  radiusKeyframes: string[];
  rotate: number[];
  duration: number;
  delay: number;
}[] = [
  {
    id: 1,
    base: 220,
    blur: 36,
    gradient:
      "radial-gradient(circle, rgba(94,234,212,0.7) 0%, rgba(45,212,191,0.28) 32%, transparent 68%)",
    scale: [0.4, 1.6, 3.2, 5.2],
    opacity: [0.28, 0.72, 0.4, 0.28],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "44% 56% 52% 48%",
      "56% 44% 48% 52%",
      "50%",
    ],
    rotate: [0, 12, -6, 0],
    duration: 8,
    delay: 0,
  },
  {
    id: 2,
    base: 260,
    blur: 42,
    gradient:
      "radial-gradient(circle, rgba(167,139,250,0.62) 0%, rgba(139,92,246,0.22) 36%, transparent 68%)",
    scale: [0.35, 1.5, 3.0, 5.0],
    opacity: [0.24, 0.65, 0.35, 0.24],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "58% 42% 48% 52%",
      "42% 58% 54% 46%",
      "50%",
    ],
    rotate: [0, -14, 8, 0],
    duration: 9.5,
    delay: 1.6,
  },
  {
    id: 3,
    base: 240,
    blur: 38,
    gradient:
      "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(94,234,212,0.3) 28%, transparent 65%)",
    scale: [0.38, 1.7, 3.4, 5.4],
    opacity: [0.22, 0.68, 0.36, 0.22],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "48% 52% 56% 44%",
      "52% 48% 44% 56%",
      "50%",
    ],
    rotate: [0, 8, -10, 0],
    duration: 8.5,
    delay: 3.2,
  },
  {
    id: 4,
    base: 280,
    blur: 46,
    gradient:
      "radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(244,114,182,0.22) 38%, transparent 68%)",
    scale: [0.32, 1.4, 2.9, 4.9],
    opacity: [0.22, 0.6, 0.32, 0.22],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "40% 60% 50% 50%",
      "60% 40% 48% 52%",
      "50%",
    ],
    rotate: [0, -8, 12, 0],
    duration: 10,
    delay: 0.8,
  },
  {
    id: 5,
    base: 300,
    blur: 50,
    gradient:
      "radial-gradient(circle, rgba(232,121,249,0.5) 0%, rgba(167,139,250,0.2) 40%, transparent 70%)",
    scale: [0.3, 1.45, 3.1, 5.1],
    opacity: [0.2, 0.58, 0.3, 0.2],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "54% 46% 50% 50%",
      "46% 54% 52% 48%",
      "50%",
    ],
    rotate: [0, 10, -5, 0],
    duration: 11,
    delay: 4.5,
  },
  {
    id: 6,
    base: 200,
    blur: 32,
    gradient:
      "radial-gradient(circle, rgba(45,212,191,0.75) 0%, rgba(94,234,212,0.25) 34%, transparent 66%)",
    scale: [0.45, 1.8, 3.5, 5.5],
    opacity: [0.26, 0.7, 0.38, 0.26],
    radius: "50%",
    radiusKeyframes: [
      "50%",
      "50%",
      "46% 54% 48% 52%",
      "50%",
    ],
    rotate: [0, -6, 4, 0],
    duration: 7.5,
    delay: 2.4,
  },
  {
    id: 7,
    base: 320,
    blur: 54,
    gradient:
      "radial-gradient(circle, rgba(94,234,212,0.4) 0%, rgba(251,191,36,0.15) 42%, transparent 70%)",
    scale: [0.28, 1.3, 2.8, 4.8],
    opacity: [0.18, 0.52, 0.28, 0.18],
    radius: "50%",
    radiusKeyframes: ["50%", "48% 52% 55% 45%", "52% 48% 45% 55%", "50%"],
    rotate: [0, 5, -8, 0],
    duration: 12,
    delay: 5.8,
  },
];

const DRIFTS: {
  id: number;
  size: number;
  blur: number;
  gradient: string;
  x: number[];
  y: number[];
  scale: number[];
  opacity: number[];
  radius: string[];
  duration: number;
  delay: number;
}[] = [
  {
    id: 1,
    size: 340,
    blur: 48,
    gradient:
      "radial-gradient(circle, rgba(94,234,212,0.42) 0%, transparent 70%)",
    x: [0, 140, 320, 180, 0],
    y: [0, -50, 30, 60, 0],
    scale: [0.75, 1.25, 1.55, 1.1, 0.75],
    opacity: [0.4, 0.7, 0.5, 0.62, 0.4],
    radius: [
      "50%",
      "40% 60% 55% 45%",
      "58% 42% 48% 52%",
      "46% 54% 50% 50%",
      "50%",
    ],
    duration: 12,
    delay: 0,
  },
  {
    id: 2,
    size: 300,
    blur: 44,
    gradient:
      "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)",
    x: [0, 200, 380, 220, 0],
    y: [0, 60, -40, -70, 0],
    scale: [0.7, 1.2, 1.5, 1.05, 0.7],
    opacity: [0.35, 0.65, 0.45, 0.55, 0.35],
    radius: [
      "50%",
      "55% 45% 40% 60%",
      "42% 58% 52% 48%",
      "50%",
      "50%",
    ],
    duration: 14,
    delay: 2,
  },
  {
    id: 3,
    size: 360,
    blur: 52,
    gradient:
      "radial-gradient(circle, rgba(251,191,36,0.32) 0%, transparent 70%)",
    x: [0, 100, 260, 360, 0],
    y: [0, 70, 40, -30, 0],
    scale: [0.65, 1.15, 1.4, 1.15, 0.65],
    opacity: [0.32, 0.58, 0.42, 0.5, 0.32],
    radius: [
      "50%",
      "48% 52% 58% 42%",
      "54% 46% 44% 56%",
      "50%",
      "50%",
    ],
    duration: 15,
    delay: 4,
  },
  {
    id: 4,
    size: 280,
    blur: 40,
    gradient:
      "radial-gradient(circle, rgba(244,114,182,0.38) 0%, transparent 70%)",
    x: [0, -60, 120, 240, 0],
    y: [0, -80, -100, -20, 0],
    scale: [0.8, 1.3, 1.2, 0.95, 0.8],
    opacity: [0.38, 0.68, 0.48, 0.58, 0.38],
    radius: [
      "50%",
      "44% 56% 50% 50%",
      "56% 44% 48% 52%",
      "50%",
      "50%",
    ],
    duration: 11,
    delay: 1.2,
  },
  {
    id: 5,
    size: 400,
    blur: 56,
    gradient:
      "radial-gradient(circle, rgba(45,212,191,0.3) 0%, rgba(167,139,250,0.12) 50%, transparent 72%)",
    x: [0, 160, 340, 200, 0],
    y: [0, 20, -50, 40, 0],
    scale: [0.6, 1.1, 1.45, 1.05, 0.6],
    opacity: [0.3, 0.55, 0.4, 0.48, 0.3],
    radius: [
      "50%",
      "50%",
      "45% 55% 52% 48%",
      "55% 45% 48% 52%",
      "50%",
    ],
    duration: 16,
    delay: 3.5,
  },
];

const PARTICLES: {
  id: number;
  size: number;
  blur: number;
  glow: number;
  color: string;
  glowColor: string;
  x: number[];
  y: number[];
  scale: number[];
  opacity: number[];
  duration: number;
  delay: number;
}[] = Array.from({ length: 18 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 18 + i * 0.2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dist = 90 + (i % 6) * 28;
  const mid = dist * 0.55;
  const palette = [
    {
      color: "rgba(94,234,212,0.95)",
      glowColor: "rgba(94,234,212,0.7)",
    },
    {
      color: "rgba(255,255,255,0.9)",
      glowColor: "rgba(255,255,255,0.5)",
    },
    {
      color: "rgba(167,139,250,0.9)",
      glowColor: "rgba(167,139,250,0.65)",
    },
    {
      color: "rgba(251,191,36,0.85)",
      glowColor: "rgba(251,191,36,0.55)",
    },
    {
      color: "rgba(244,114,182,0.85)",
      glowColor: "rgba(244,114,182,0.55)",
    },
  ][i % 5];
  return {
    id: i,
    size: 4 + (i % 5) * 2.2,
    blur: 1 + (i % 3) * 0.6,
    glow: 10 + (i % 4) * 4,
    color: palette.color,
    glowColor: palette.glowColor,
    x: [cos * 50, cos * mid, cos * dist, cos * (mid * 0.9), cos * 50],
    y: [sin * 50, sin * mid, sin * dist, sin * (mid * 0.9), sin * 50],
    scale: [0.7, 1.25, 0.9, 1.1, 0.7],
    opacity: [0.45, 0.85, 0.4, 0.7, 0.45],
    duration: 5.5 + (i % 5) * 0.9,
    delay: (i * 0.28) % 3.5,
  };
});

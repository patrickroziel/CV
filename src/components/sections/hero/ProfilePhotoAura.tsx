"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const SOFT = "easeInOut" as const;

type ProfilePhotoAuraProps = {
  photo: string | null;
  name: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Profile photo with intense local bloom.
 * Full-card cinematic waves live in HeroPhotoWaves (card-level layer).
 */
export function ProfilePhotoAura({
  photo,
  name,
  className,
  children,
}: ProfilePhotoAuraProps) {
  const reduce = useReducedMotion();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "PR";

  return (
    <div
      className={cn(
        "relative mx-auto h-40 w-40 overflow-visible sm:h-48 sm:w-48",
        className
      )}
    >
      {/* Intense local bloom — showreel energy at the source */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 z-0 rounded-full sm:-inset-12"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(94,234,212,0.55) 28%, rgba(167,139,250,0.25) 55%, transparent 75%)",
          filter: "blur(22px)",
        }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.14, 0.96, 1.1, 1],
                opacity: [0.65, 0.95, 0.7, 0.9, 0.65],
              }
        }
        transition={{ duration: 5.5, repeat: Infinity, ease: SOFT }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-6 z-0 rounded-full sm:-inset-8"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(244,114,182,0.2) 45%, transparent 70%)",
          filter: "blur(18px)",
        }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1.05, 0.94, 1.12, 1, 1.05],
                opacity: [0.5, 0.8, 0.55, 0.75, 0.5],
              }
        }
        transition={{ duration: 6.5, repeat: Infinity, ease: SOFT, delay: 0.4 }}
      />

      {/* Photo disc */}
      <div className="relative z-10 h-full w-full overflow-hidden rounded-full bg-zinc-900 shadow-[0_0_50px_-4px_rgba(94,234,212,0.65),0_0_80px_-12px_rgba(167,139,250,0.4),0_16px_40px_-12px_rgba(0,0,0,0.7)] ring-2 ring-white/20">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-zinc-600">
            {initials}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_28px_rgba(0,0,0,0.4)]" />
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
      </div>

      {children}
    </div>
  );
}

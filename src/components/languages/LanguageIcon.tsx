"use client";

import type { LanguageIconStyle } from "@/lib/types";
import {
  cultureEmoji,
  monumentEmoji,
  REGION_PATHS,
  regionFlag,
} from "@/lib/language-regions";
import { cn } from "@/lib/utils";

type LanguageIconProps = {
  style: LanguageIconStyle;
  primaryRegion: string;
  languageName: string;
  className?: string;
};

export function LanguageIcon({
  style,
  primaryRegion,
  languageName,
  className,
}: LanguageIconProps) {
  const code = (primaryRegion || "FR").toUpperCase();

  if (style === "flag") {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl leading-none backdrop-blur-md",
          className
        )}
        aria-hidden
      >
        {regionFlag(code)}
      </span>
    );
  }

  if (style === "monument") {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl leading-none backdrop-blur-md",
          className
        )}
        aria-hidden
      >
        {monumentEmoji(code, languageName)}
      </span>
    );
  }

  if (style === "culture") {
    return (
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl leading-none backdrop-blur-md",
          className
        )}
        aria-hidden
      >
        {cultureEmoji(code, languageName)}
      </span>
    );
  }

  // outline — main country silhouette with soft glow
  const path = REGION_PATHS[code] || REGION_PATHS.FR;
  return (
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10 backdrop-blur-md",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 80 80"
        className="h-6 w-6 overflow-visible"
        fill="none"
      >
        <path
          d={path}
          className="stroke-teal-300/90"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 4px rgba(94,234,212,0.55))",
          }}
        />
      </svg>
    </span>
  );
}

"use client";

import type { SkillIcon } from "@/lib/types";
import { getL } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

export function SkillIconsRow({
  icons,
  size = "md",
}: {
  icons?: SkillIcon[];
  size?: "sm" | "md" | "lg";
}) {
  if (!icons?.length) return null;
  const box =
    size === "lg"
      ? "h-11 w-11 text-xl"
      : size === "sm"
        ? "h-7 w-7 text-sm"
        : "h-9 w-9 text-base";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {icons.map((ic) => {
        const label = getL(ic.label);
        return (
          <span
            key={ic.id}
            title={label || undefined}
            className={cn(
              "glass-chip inline-flex items-center justify-center overflow-hidden rounded-xl",
              box
            )}
          >
            {ic.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ic.src}
                alt={label || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{ic.emoji || "•"}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

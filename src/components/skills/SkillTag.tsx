"use client";

import { badgeVariants } from "@/components/ui/badge";
import { useSkillDetail } from "@/components/skills/SkillDetailProvider";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type SkillTagProps = {
  /** Skill name, tag label, or skill id */
  label: string;
  className?: string;
  variant?: VariantProps<typeof badgeVariants>["variant"];
  /** Stop click from bubbling (e.g. tags inside a Link) */
  stopPropagation?: boolean;
};

/**
 * Clickable skill / tech / tag chip.
 * Opens the global skill detail card from anywhere on the site.
 */
export function SkillTag({
  label,
  className,
  variant = "secondary",
  stopPropagation = true,
}: SkillTagProps) {
  const { openSkillDetail } = useSkillDetail();

  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        openSkillDetail(label);
      }}
      className={cn(
        badgeVariants({ variant }),
        "cursor-pointer transition hover:border-teal-300/40 hover:bg-teal-300/15 hover:text-teal-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50",
        className
      )}
    >
      {label}
    </button>
  );
}

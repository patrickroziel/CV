"use client";

import { EyeOff } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_NAV, type NavItemId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Gates a page section by portfolio nav/section visibility.
 * - Public: hidden when `nav[id].visible === false`
 * - Edit Mode: always shown, with a clear “Masquée” badge
 * DOM id / anchors stay on the child section — no scroll breakage.
 */
export function useSectionVisible(id: NavItemId): {
  /** Whether the public may see this section */
  publicVisible: boolean;
  /** Whether to render (edit mode always true) */
  shouldRender: boolean;
  /** Show edit-mode hidden badge */
  showHiddenBadge: boolean;
} {
  const { data, editMode } = usePortfolio();
  const publicVisible = (data.nav ?? DEFAULT_NAV)[id]?.visible !== false;
  return {
    publicVisible,
    shouldRender: editMode || publicVisible,
    showHiddenBadge: editMode && !publicVisible,
  };
}

type SectionVisibilityProps = {
  id: NavItemId;
  children: React.ReactNode;
  className?: string;
};

export function SectionVisibility({
  id,
  children,
  className,
}: SectionVisibilityProps) {
  const { shouldRender, showHiddenBadge } = useSectionVisible(id);

  if (!shouldRender) return null;

  return (
    <div className={cn("relative", className)}>
      {showHiddenBadge && (
        <div
          className={cn(
            "pointer-events-none absolute right-3 top-3 z-30 sm:right-6 sm:top-6",
            "inline-flex items-center gap-1.5 rounded-full border border-amber-400/35",
            "bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            "text-amber-100 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.5)] backdrop-blur-md"
          )}
        >
          <EyeOff className="h-3 w-3" />
          Masquée
        </div>
      )}
      {showHiddenBadge && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] ring-1 ring-inset ring-amber-400/20"
          aria-hidden
        />
      )}
      <div className={cn(showHiddenBadge && "relative z-[2]")}>{children}</div>
    </div>
  );
}

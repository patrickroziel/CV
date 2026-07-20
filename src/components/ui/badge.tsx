import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-teal-300/30 bg-teal-300/15 text-teal-100",
        amber:
          "border-amber-400/30 bg-amber-400/15 text-amber-100",
        secondary:
          "glass-chip text-zinc-200",
        outline:
          "border-white/18 bg-white/[0.04] text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

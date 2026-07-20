import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  nested?: boolean;
  glow?: boolean;
  /** Stronger blur, border & highlights (Hero / featured) */
  elevated?: boolean;
  as?: "div" | "section" | "article";
};

export function GlassCard({
  className,
  nested = false,
  glow = false,
  elevated = false,
  as: Tag = "div",
  children,
  ...props
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        nested ? "glass-nested" : "glass-card",
        elevated && !nested && "glass-elevated",
        glow && "glass-glow transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function GlassPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel", className)} {...props}>
      {children}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { RichHtml } from "@/components/shared/RichHtml";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  eyebrowClassName?: string;
  action?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  eyebrowClassName,
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45 }}
        className="max-w-2xl"
      >
        {eyebrow && (
          <p
            className={cn(
              "mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400",
              eyebrowClassName
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <RichHtml
            html={description}
            className="mt-2 text-sm text-zinc-400 sm:text-base"
          />
        )}
      </motion.div>
      {action && <div className="no-print shrink-0">{action}</div>}
    </div>
  );
}

"use client";

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL = "patrickroziel@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent("Contact depuis patrickroziel.com")}`;

export function ContactButton({ className }: { className?: string }) {
  return (
    <a
      href={MAILTO}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-amber-200/[0.06] px-4 py-2 text-sm font-medium text-zinc-100 shadow-lg backdrop-blur-md transition hover:border-amber-200/45 hover:bg-amber-200/[0.12] hover:text-white",
        className
      )}
    >
      <Mail className="h-4 w-4 text-amber-200/90" />
      <span>Contact</span>
      <span className="hidden text-xs text-zinc-400 group-hover:text-zinc-300 sm:inline">
        {EMAIL}
      </span>
    </a>
  );
}

"use client";

import { track } from "@vercel/analytics";

const KOFI_URL = "https://ko-fi.com/patrickroziel";

export function TipsLink() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("kofi_click")}
      className="glass-chip inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold tracking-wide text-zinc-100 transition hover:bg-white/10 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-xs"
      aria-label="Tips sur Ko-fi"
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3 text-amber-100 sm:h-3.5 sm:w-3.5" fill="none" aria-hidden="true">
        <rect x="3" y="5.5" width="18" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span>Tips</span>
    </a>
  );
}

export function SupportBar() {
  return (
    <div className="bottom-dock no-print">
      <div id="bottom-actions-slot" className="bottom-actions-slot" />
      <div id="bottom-nav-slot" className="bottom-nav-slot" />
    </div>
  );
}

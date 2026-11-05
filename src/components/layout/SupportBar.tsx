"use client";

import { track } from "@vercel/analytics";

const KOFI_URL = "https://ko-fi.com/patrickroziel";

export function SupportBar() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("kofi_click")}
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-white shadow-lg backdrop-blur-md transition hover:bg-black/85 sm:bottom-6 sm:right-6"
      aria-label="Soutenir mon travail sur Ko-fi"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden>
        <path
          d="M7 8.5h8.2a2.3 2.3 0 0 1 0 4.6H15"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M6.2 7.2h9.1v7.1a3.6 3.6 0 0 1-3.6 3.6H9.8a3.6 3.6 0 0 1-3.6-3.6V7.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M8.2 19.4h7.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path
          d="M9.2 4.6c.3.7.3 1.1 0 1.8M12 4.2c.3.7.3 1.1 0 1.8M14.8 4.6c.3.7.3 1.1 0 1.8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-medium sm:text-sm">Soutenir</span>
    </a>
  );
}

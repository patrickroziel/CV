"use client";

import { track } from "@vercel/analytics";

const KOFI_URL = "https://ko-fi.com/patrickroziel";

export function SupportBar() {
  return (
    <div className="bottom-dock no-print">
      <div id="bottom-nav-slot" className="bottom-nav-slot" />
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("kofi_click")}
        className="support-bar group"
        aria-label="Tips sur Ko-fi"
      >
      <span className="support-bar__sheen" aria-hidden="true" />
      <span className="support-bar__inner">
        <span className="support-bar__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="support-bar__cup" fill="none">
            <rect x="2.5" y="6" width="19" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.5 10h19" stroke="currentColor" strokeWidth="1.5" />
            <rect x="5.2" y="12.6" width="3.4" height="2.3" rx="0.4" fill="currentColor" />
          </svg>
        </span>
        <span className="support-bar__copy">
          <span className="support-bar__title">Tips</span>
        </span>
        <span className="support-bar__cta">
          <svg viewBox="0 0 24 24" className="support-bar__card" fill="none" aria-hidden="true">
            <rect x="3" y="5.5" width="18" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </span>
      </a>
    </div>
  );
}

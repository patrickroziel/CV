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
          <span className="support-bar__kicker">Ko-fi</span>
          <span className="support-bar__title">tips</span>
        </span>
        <span className="support-bar__cta">
          <span>Soutenir</span>
          <svg viewBox="0 0 16 16" className="support-bar__arrow" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      </a>
    </div>
  );
}

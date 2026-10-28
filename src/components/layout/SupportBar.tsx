"use client";

const KOFI_URL = "https://ko-fi.com/patrickroziel";

export function SupportBar() {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="support-bar no-print group"
      aria-label="Soutenir mon travail sur Ko-fi"
    >
      <span className="support-bar__sheen" aria-hidden="true" />
      <span className="support-bar__inner">
        <span className="support-bar__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="support-bar__cup" fill="none">
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
        </span>
        <span className="support-bar__copy">
          <span className="support-bar__kicker">Ko-fi</span>
          <span className="support-bar__title">Soutenir mon travail</span>
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
  );
}

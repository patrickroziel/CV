const KOFI_URL = "https://ko-fi.com/patrickroziel";

export function KofiCard({ className = "" }: { className?: string }) {
  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`kofi-card no-print group ${className}`}
      aria-label="Soutenir mon travail sur Ko-fi"
    >
      <span className="kofi-card__sheen" aria-hidden="true" />
      <span className="kofi-card__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="kofi-card__card" fill="none">
          <rect x="3" y="5.5" width="18" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="kofi-card__kicker">Ko-fi</span>
        <span className="kofi-card__title">Soutenir mon travail</span>
      </span>
    </a>
  );
}

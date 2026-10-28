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
        <svg viewBox="0 0 24 24" className="kofi-card__cup" fill="none">
          <path d="M9.1 5.2c.35.7.15 1.15-.15 1.7M12 4.6c.35.75.15 1.2-.15 1.8M14.8 5.2c.35.7.15 1.15-.15 1.7" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" className="kofi-card__steam" />
          <path d="M7.1 9h8.1a2.15 2.15 0 0 1 0 4.3H15" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <path d="M6.3 8.2h9v6.8a3.4 3.4 0 0 1-3.4 3.4H9.7a3.4 3.4 0 0 1-3.4-3.4V8.2Z" stroke="currentColor" strokeWidth="1.35" />
          <path d="M8.4 19.6h7.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="kofi-card__kicker">Ko-fi</span>
        <span className="kofi-card__title">Soutenir mon travail</span>
      </span>
    </a>
  );
}

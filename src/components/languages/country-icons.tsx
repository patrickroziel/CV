"use client";

/**
 * Hand-crafted country emblems (SVG) — clear, elegant, country-specific.
 * Not generic emoji: designed marks for FR, BE, CH, CA, GB, US, etc.
 */

type IconProps = { className?: string };

export function FlagFR({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="10.67" height="24" fill="#002395" />
      <rect x="10.67" width="10.66" height="24" fill="#fff" />
      <rect x="21.33" width="10.67" height="24" fill="#ED2939" />
      <rect
        width="31"
        height="23"
        x="0.5"
        y="0.5"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        rx="2"
      />
    </svg>
  );
}

export function FlagBE({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="10.67" height="24" fill="#000" />
      <rect x="10.67" width="10.66" height="24" fill="#FAE042" />
      <rect x="21.33" width="10.67" height="24" fill="#ED2939" />
      <rect width="31" height="23" x="0.5" y="0.5" fill="none" stroke="rgba(255,255,255,0.2)" rx="2" />
    </svg>
  );
}

export function FlagCH({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="24" rx="2" fill="#D52B1E" />
      <rect x="13" y="6" width="6" height="12" fill="#fff" />
      <rect x="10" y="9" width="12" height="6" fill="#fff" />
    </svg>
  );
}

export function FlagCA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="8" height="24" fill="#FF0000" />
      <rect x="8" width="16" height="24" fill="#fff" />
      <rect x="24" width="8" height="24" fill="#FF0000" />
      <path
        d="M16 6l1.2 3.2h3.4l-2.7 2 1 3.2L16 12.6l-2.9 1.8 1-3.2-2.7-2h3.4z"
        fill="#FF0000"
      />
    </svg>
  );
}

export function FlagGB({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="24" fill="#012169" />
      <path d="M0 0L32 24M32 0L0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0L32 24M32 0L0 24" stroke="#C8102E" strokeWidth="2" />
      <path d="M16 0v24M0 12h32" stroke="#fff" strokeWidth="6" />
      <path d="M16 0v24M0 12h32" stroke="#C8102E" strokeWidth="3.2" />
    </svg>
  );
}

export function FlagUS({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <rect
          key={i}
          y={i * (24 / 13)}
          width="32"
          height={24 / 13}
          fill={i % 2 === 0 ? "#B22234" : "#fff"}
        />
      ))}
      <rect width="13" height="10.5" fill="#3C3B6E" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={2 + c * 3}
            cy={2 + r * 3}
            r="0.55"
            fill="#fff"
          />
        ))
      )}
    </svg>
  );
}

export function FlagIE({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="10.67" height="24" fill="#169B62" />
      <rect x="10.67" width="10.66" height="24" fill="#fff" />
      <rect x="21.33" width="10.67" height="24" fill="#FF883E" />
    </svg>
  );
}

export function FlagAU({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="24" fill="#00008B" />
      <path d="M0 0L12 9M12 0L0 9" stroke="#fff" strokeWidth="1.5" />
      <path d="M0 0L12 9M12 0L0 9" stroke="#C8102E" strokeWidth="0.7" />
      <path d="M6 0v9M0 4.5h12" stroke="#fff" strokeWidth="2" />
      <path d="M6 0v9M0 4.5h12" stroke="#C8102E" strokeWidth="1" />
      <circle cx="22" cy="12" r="1.2" fill="#fff" />
      <circle cx="26" cy="8" r="0.7" fill="#fff" />
      <circle cx="28" cy="14" r="0.7" fill="#fff" />
      <circle cx="20" cy="16" r="0.6" fill="#fff" />
    </svg>
  );
}

export function FlagPL({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="12" fill="#fff" />
      <rect y="12" width="32" height="12" fill="#DC143C" />
      <rect width="31" height="23" x="0.5" y="0.5" fill="none" stroke="rgba(255,255,255,0.2)" rx="2" />
    </svg>
  );
}

export function FlagDE({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="8" fill="#000" />
      <rect y="8" width="32" height="8" fill="#D00" />
      <rect y="16" width="32" height="8" fill="#FFCE00" />
    </svg>
  );
}

export function FlagLT({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="8" fill="#FDB913" />
      <rect y="8" width="32" height="8" fill="#006A44" />
      <rect y="16" width="32" height="8" fill="#C1272D" />
    </svg>
  );
}

export function FlagUA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="12" fill="#0057B7" />
      <rect y="12" width="32" height="12" fill="#FFD700" />
    </svg>
  );
}

export function FlagLU({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 24" className={className} aria-hidden>
      <rect width="32" height="8" fill="#ED2939" />
      <rect y="8" width="32" height="8" fill="#fff" />
      <rect y="16" width="32" height="8" fill="#00A1DE" />
    </svg>
  );
}

/** Emblem icons — strong cultural marks */
export function EmblemFRTower({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M16 3 L18 10 H22 L19 12 L20.5 18 H11.5 L13 12 L10 10 H14 Z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="0.6"
      />
      <path d="M12 18 H20 V28 H12 Z" fill="#fcd34d" opacity="0.9" />
      <path d="M11 21 H21 M11 24 H21" stroke="#b45309" strokeWidth="0.8" />
      <circle cx="16" cy="5" r="1" fill="#fef3c7" />
    </svg>
  );
}

export function EmblemUSLiberty({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M16 4 L18 9 L16 8 L14 9 Z M12 9 H20 V11 H12 Z"
        fill="#a7f3d0"
      />
      <path d="M13 11 H19 V22 H13 Z" fill="#5eead4" />
      <path d="M10 22 H22 V26 H10 Z" fill="#2dd4bf" />
      <path d="M15 14 H17 V20 H15 Z" fill="#0f766e" />
    </svg>
  );
}

export function EmblemGBCrown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M6 14 L10 8 L16 12 L22 8 L26 14 L24 22 H8 Z"
        fill="#fbbf24"
        stroke="#d97706"
        strokeWidth="0.8"
      />
      <circle cx="10" cy="10" r="1.2" fill="#fef3c7" />
      <circle cx="16" cy="9" r="1.2" fill="#fef3c7" />
      <circle cx="22" cy="10" r="1.2" fill="#fef3c7" />
      <rect x="9" y="22" width="14" height="3" rx="0.5" fill="#b45309" />
    </svg>
  );
}

export function EmblemPLEagle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M16 6 C18 8 22 9 24 12 C22 12 20 14 19 16 C22 17 24 20 24 24 C20 22 18 24 16 26 C14 24 12 22 8 24 C8 20 10 17 13 16 C12 14 10 12 8 12 C10 9 14 8 16 6 Z"
        fill="#f8fafc"
        stroke="#e2e8f0"
        strokeWidth="0.6"
      />
      <circle cx="14" cy="13" r="0.8" fill="#0f172a" />
      <circle cx="18" cy="13" r="0.8" fill="#0f172a" />
      <path d="M15 15.5 L16 17 L17 15.5" stroke="#f59e0b" strokeWidth="0.8" />
    </svg>
  );
}

export function EmblemCAMaple({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M16 5 L18 11 L24 9 L21 14 L27 16 L21 18 L24 23 L18 21 L16 27 L14 21 L8 23 L11 18 L5 16 L11 14 L8 9 L14 11 Z"
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function EmblemCHCross({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect x="4" y="4" width="24" height="24" rx="4" fill="#dc2626" />
      <rect x="14" y="9" width="4" height="14" fill="#fff" />
      <rect x="9" y="14" width="14" height="4" fill="#fff" />
    </svg>
  );
}

export function EmblemBELion({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M10 20 C10 14 14 10 16 9 C18 10 22 14 22 20 C20 22 18 24 16 25 C14 24 12 22 10 20 Z"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="0.7"
      />
      <path d="M12 14 L10 11 M20 14 L22 11" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="14" cy="16" r="0.7" fill="#422006" />
      <circle cx="18" cy="16" r="0.7" fill="#422006" />
    </svg>
  );
}

export function EmblemIEShamrock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <circle cx="16" cy="11" r="5" fill="#22c55e" />
      <circle cx="11" cy="17" r="5" fill="#16a34a" />
      <circle cx="21" cy="17" r="5" fill="#16a34a" />
      <path d="M16 18 V27" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmblemAUStar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="#1e3a8a" />
      <path
        d="M16 6 L18 13 H25 L19.5 17 L21.5 24 L16 20 L10.5 24 L12.5 17 L7 13 H14 Z"
        fill="#f8fafc"
      />
    </svg>
  );
}

export function EmblemWine({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path
        d="M10 6 H22 L20 14 C20 18 18 20 16 20 C14 20 12 18 12 14 Z"
        fill="#f87171"
        stroke="#b91c1c"
        strokeWidth="0.7"
      />
      <path d="M16 20 V26 M12 26 H20" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function EmblemCoffee({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <rect x="7" y="10" width="15" height="12" rx="2" fill="#fef3c7" stroke="#d6d3d1" />
      <path d="M22 13 H25 C26.5 13 27 15 27 16.5 C27 18 26.5 20 25 20 H22" stroke="#a8a29e" strokeWidth="1.5" />
      <path d="M11 7 C12 5 13 5 14 7 M15 7 C16 5 17 5 18 7" stroke="#a8a29e" strokeWidth="1" strokeLinecap="round" />
      <rect x="9" y="12" width="11" height="6" rx="1" fill="#78350f" opacity="0.85" />
    </svg>
  );
}

export function EmblemPierogi({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <ellipse cx="16" cy="17" rx="11" ry="8" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
      <path d="M7 17 Q16 22 25 17" stroke="#f59e0b" strokeWidth="1" fill="none" />
      <circle cx="12" cy="15" r="0.8" fill="#b45309" />
      <circle cx="16" cy="14" r="0.8" fill="#b45309" />
      <circle cx="20" cy="15" r="0.8" fill="#b45309" />
    </svg>
  );
}

const FLAG_MAP: Record<string, React.FC<IconProps>> = {
  FR: FlagFR,
  BE: FlagBE,
  CH: FlagCH,
  CA: FlagCA,
  GB: FlagGB,
  US: FlagUS,
  IE: FlagIE,
  AU: FlagAU,
  PL: FlagPL,
  DE: FlagDE,
  LT: FlagLT,
  UA: FlagUA,
  LU: FlagLU,
};

const EMBLEM_MAP: Record<string, React.FC<IconProps>[]> = {
  FR: [EmblemFRTower, EmblemWine],
  BE: [EmblemBELion, EmblemWine],
  CH: [EmblemCHCross],
  CA: [EmblemCAMaple],
  GB: [EmblemGBCrown, EmblemCoffee],
  US: [EmblemUSLiberty],
  IE: [EmblemIEShamrock],
  AU: [EmblemAUStar],
  PL: [EmblemPLEagle, EmblemPierogi],
  DE: [EmblemBELion],
  LU: [EmblemCHCross],
  LT: [EmblemPLEagle],
  UA: [EmblemPLEagle],
};

export function CountryFlagIcon({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const C = FLAG_MAP[code.toUpperCase()];
  if (!C) {
    return (
      <span className={className} style={{ fontSize: 18 }}>
        {code}
      </span>
    );
  }
  return <C className={className || "h-6 w-8"} />;
}

/** Monument / culture custom marks for a country */
export function CountryEmblemIcon({
  code,
  variant = 0,
  className,
}: {
  code: string;
  variant?: number;
  className?: string;
}) {
  const list = EMBLEM_MAP[code.toUpperCase()];
  const C = list?.[variant % (list?.length || 1)] || EmblemFRTower;
  return <C className={className || "h-7 w-7"} />;
}

export function hasCustomFlag(code: string): boolean {
  return Boolean(FLAG_MAP[code.toUpperCase()]);
}

export function emblemCount(code: string): number {
  return EMBLEM_MAP[code.toUpperCase()]?.length ?? 1;
}

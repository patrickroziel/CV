import type { SVGProps } from "react";

/** Trois vagues, pour Notes. */
export function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" aria-hidden="true" {...props} stroke="#38bdf8" strokeWidth="1.7">
      <path d="M2.4 8.2c1.5 0 1.5-1.8 3.1-1.8s1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8" />
      <path d="M2.4 12.6c1.5 0 1.5-1.8 3.1-1.8s1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8" />
      <path d="M2.4 17c1.5 0 1.5-1.8 3.1-1.8s1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8 1.5-1.8 3.1-1.8 1.6 1.8 3.1 1.8" />
    </svg>
  );
}

/** Nuage simple, pour Scope. */
export function AirIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" aria-hidden="true" {...props} stroke="#e4e4e7" strokeWidth="1.7">
      <path d="M7.4 17.6h9a3.5 3.5 0 0 0 .4-7 4.5 4.5 0 0 0-8.6-1.5 3.2 3.2 0 0 0-.8 8.5z" />
    </svg>
  );
}

/** Deux arbres, pour Work. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" {...props} stroke="#4ade80" strokeWidth="1.6">
      <path d="M8.2 19.5v-2.6" />
      <path d="M5.5 16.9h5.4L8.2 11.2 5.5 16.9z" />
      <path d="M6.3 13.4h3.8L8.2 8.6 6.3 13.4z" />
      <path d="M16.2 19.5V16" />
      <path d="M12.6 16h7.2L16.2 8.8 12.6 16z" />
      <path d="M13.7 11.6h5L16.2 5.6l-2.5 6z" />
    </svg>
  );
}

/** Soleil, pour Lights. */
export function LightsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" aria-hidden="true" {...props} stroke="#fb923c" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3.15" />
      <path d="M12 3.4v2.1M12 18.5v2.1M3.4 12h2.1M18.5 12h2.1M5.9 5.9l1.5 1.5M16.6 16.6l1.5 1.5M18.1 5.9l-1.5 1.5M7.4 16.6 5.9 18.1" />
    </svg>
  );
}

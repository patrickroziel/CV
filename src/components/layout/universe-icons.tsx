import type { SVGProps } from "react";

/** La vague envoyée : une crête qui se recourbe, deux lignes d'eau en dessous. */
export function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M1.2 10.6C7.2 10.2 9.2 3.4 14 2.4C19.2 1.2 22.8 5.2 20.4 9.2C18.8 11.2 16.2 10 16.5 8" />
      <path d="M0.8 11.6C4.2 12.5 8.2 12.2 13.2 10.7C17.2 9.5 20.2 11.2 23.2 10.5" />
      <path d="M0.8 13.4C4.2 14.3 8.2 14 13.2 12.5C17.2 11.3 20 13 22.8 12.3" />
    </svg>
  );
}

/** Nuage rond, pour Air. */
export function AirIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13.31 6.00 L14.25 6.00 L15.19 6.19 L16.12 6.56 L17.06 7.31 L17.91 8.25 L18.56 9.00 L19.50 9.38 L20.44 10.22 L21.00 11.16 L21.38 12.09 L21.56 13.03 L21.56 13.97 L21.47 14.91 L21.19 15.84 L20.72 16.78 L19.97 17.62 L19.03 18.19 L18.09 18.38 L17.16 18.19 L16.22 17.62 L15.28 17.62 L14.34 17.62 L13.41 17.62 L12.47 17.62 L11.53 17.62 L10.59 18.19 L9.66 18.56 L8.72 18.75 L7.78 18.75 L6.84 18.56 L5.91 18.28 L4.97 17.62 L4.22 16.97 L3.66 16.03 L3.28 15.09 L3.19 14.16 L3.28 13.22 L3.56 12.28 L4.12 11.34 L4.97 10.50 L5.91 9.84 L6.84 9.56 L7.78 9.38 L8.72 9.38 L9.47 9.00 L10.03 8.06 L10.88 7.12 L11.81 6.47 L12.75 6.19 Z" />
    </svg>
  );
}

/** Trois bûches en tas : deux en bas, une au-dessus. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8.4 6.9h6.4a3.3 3.3 0 0 1 0 6.6H8.4" />
      <path d="M12.4 8.6h2.8M12.4 11h3.4" />
      <circle cx="8.4" cy="10.2" r="3.3" />
      <circle cx="8.4" cy="10.2" r="1.9" />
      <circle cx="8.4" cy="10.2" r="0.7" />
      <circle cx="5.7" cy="16.5" r="3.75" />
      <circle cx="5.7" cy="16.5" r="2.2" />
      <circle cx="5.7" cy="16.5" r="0.8" />
      <path d="M10.5 12.75h7.1a3.75 3.75 0 0 1 0 7.5H10.5" />
      <path d="M14.6 15.2h3.2M14.6 17.8h2.4" />
      <circle cx="10.5" cy="16.5" r="3.75" />
      <circle cx="10.5" cy="16.5" r="2.2" />
      <circle cx="10.5" cy="16.5" r="0.8" />
    </svg>
  );
}

/** Trois petits rayons, pour Lights. */
export function LightsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M12 15.2V6.5" />
      <path d="M7.6 16.4 4.4 9.2" />
      <path d="M16.4 16.4 19.6 9.2" />
    </svg>
  );
}

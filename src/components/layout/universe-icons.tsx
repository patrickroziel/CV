import type { SVGProps } from "react";

function Mark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props} />;
}

/** Vague pleine : l'eau, pour Notes. */
export function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M1.6 14.4c1.7-2.8 3.4-4.2 5.2-4.2 2 0 3 2.1 4.7 2.1s2.7-2.1 4.7-2.1c1.8 0 3.5 1.4 5.2 4.2v1.6c-1.7 2.8-3.4 4.2-5.2 4.2-2 0-3-2.1-4.7-2.1s-2.7 2.1-4.7 2.1c-1.8 0-3.5-1.4-5.2-4.2v-1.6z" />
    </Mark>
  );
}

/** Nuage plein : Air. */
export function AirIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M8.1 18.4h8.6a3.85 3.85 0 0 0 .45-7.68A4.65 4.65 0 0 0 8.2 12a3.15 3.15 0 0 0-.1 6.4z" />
    </Mark>
  );
}

/** Trois planches : le bois, pour Work. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M3.5 5.2h17a1.6 1.6 0 0 1 0 3.2h-17a1.6 1.6 0 0 1 0-3.2zm0 5.2h17a1.6 1.6 0 0 1 0 3.2h-17a1.6 1.6 0 0 1 0-3.2zm0 5.2h17a1.6 1.6 0 0 1 0 3.2h-17a1.6 1.6 0 0 1 0-3.2z" />
    </Mark>
  );
}

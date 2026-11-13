import type { SVGProps } from "react";

function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

/** Vague en mouvement : l'eau poussée par le vent, la rive en dessous. */
export function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M2.5 14.2c1.6-3.6 3.8-6.2 6.6-6.2 1.8 0 3 1.3 3.6 2.8" />
      <path d="M12.4 9.2c1.3-2 3.2-2.6 4.7-1.2 1.3 1.2 1.2 2.6-.1 3.6" />
      <path d="M2.2 18.2c2.2.9 3.8.7 5.8-.6 2.2-1.4 3.8-1.4 6 0 2.1 1.3 3.8 1.5 6-.2" />
    </Mark>
  );
}

/** Nuage : le plat de l'air, trois bosses d'eau. */
export function AirIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M7.2 17.6h10.2a3.2 3.2 0 0 0 .3-6.4 4.1 4.1 0 0 0-7.9-1.2 3 3 0 0 0-2.6 7.6z" />
    </Mark>
  );
}

/** Deux bûches coupées, l'une sur l'autre. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <ellipse cx="6.6" cy="7.6" rx="2.15" ry="2.45" />
      <ellipse cx="6.6" cy="7.6" rx="0.75" ry="0.9" />
      <path d="M8.7 5.2H17a2.4 2.4 0 0 1 0 4.8H8.7" />
      <ellipse cx="6.6" cy="16.2" rx="2.15" ry="2.45" />
      <ellipse cx="6.6" cy="16.2" rx="0.75" ry="0.9" />
      <path d="M8.7 13.8H17a2.4 2.4 0 0 1 0 4.8H8.7" />
    </Mark>
  );
}

import type { SVGProps } from "react";

export { Cloud as AirIcon } from "lucide-react";

function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

/** Une seule vague, pour Notes. */
export function WaterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M2 16.4C4.4 16.4 5.6 8.2 10 8.2c4.2 0 5.1 6.6 8.4 6.6 2 0 3.1-1.7 3.8-2.8" />
    </Mark>
  );
}

/** Deux bûches coupées, l'une sur l'autre, pour Work. */
export function WoodIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Mark {...props}>
      <path d="M9.4 5.3H17.4a2.4 2.4 0 0 1 0 4.8H9.4" />
      <ellipse cx="7.3" cy="7.7" rx="2.2" ry="2.5" />
      <ellipse cx="7.3" cy="7.7" rx="0.75" ry="0.9" />
      <path d="M9.4 13.9H17.4a2.4 2.4 0 0 1 0 4.8H9.4" />
      <ellipse cx="7.3" cy="16.3" rx="2.2" ry="2.5" />
      <ellipse cx="7.3" cy="16.3" rx="0.75" ry="0.9" />
    </Mark>
  );
}

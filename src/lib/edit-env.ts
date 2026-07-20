/**
 * Whether the portfolio edit UI is allowed in this environment.
 *
 * - Local: localhost / 127.0.0.1 → allowed
 * - Production deploy → hidden
 *
 * Optional override: NEXT_PUBLIC_ALLOW_EDIT=true|false
 */
export function isEditEnvironment(): boolean {
  const override = process.env.NEXT_PUBLIC_ALLOW_EDIT;
  if (override === "true") return true;
  if (override === "false") return false;

  if (typeof window === "undefined") {
    // SSR / pre-render: never expose edit chrome in production builds
    return process.env.NODE_ENV === "development";
  }

  const host = window.location.hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".local")
  );
}

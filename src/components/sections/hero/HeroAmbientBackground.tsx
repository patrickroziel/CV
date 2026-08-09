"use client";

/**
 * Minimal scrims for vitrail Hero — forest must read through the glass.
 * Only a soft shade under the text column on large screens for contrast.
 */
export function HeroAmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit]"
    >
      {/* Very light vignette — do not hide wallpaper */}
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_30%_40%,transparent_30%,rgba(0,0,0,0.06)_70%,rgba(0,0,0,0.16)_100%)]" />
      {/* Text column shade (desktop) */}
      <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-l from-black/18 via-black/6 to-transparent lg:block" />
    </div>
  );
}

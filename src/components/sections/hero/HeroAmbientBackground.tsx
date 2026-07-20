"use client";

/**
 * Readability scrims only — cinematic energy lives in HeroPhotoWaves.
 * Kept above the wave layer (z-[2]) so text stays crisp.
 */
export function HeroAmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit]"
    >
      {/* Stronger vignette + side shade so glow never washes out type */}
      <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_22%_48%,transparent_8%,rgba(0,0,0,0.22)_42%,rgba(0,0,0,0.55)_100%)]" />
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/50 via-black/10 to-black/25" />
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-black/15 via-transparent to-black/35" />
      {/* Soft dark panel under text column on large screens */}
      <div className="absolute inset-y-0 right-0 hidden w-[58%] bg-gradient-to-l from-black/40 via-black/15 to-transparent lg:block" />
    </div>
  );
}

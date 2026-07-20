"use client";

export function AmbientOrbs() {
  return (
    <div
      className="no-print pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="orb-drift absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="orb-drift-slow absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="orb-drift absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
    </div>
  );
}

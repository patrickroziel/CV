"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";

export function Wallpaper() {
  const { data, isHydrated } = usePortfolio();
  const url = isHydrated ? data.backgroundUrl : data.backgroundUrl;
  const opacity = isHydrated ? data.ui.overlayOpacity : 0.52;

  return (
    <div className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="wallpaper-kenburns absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}

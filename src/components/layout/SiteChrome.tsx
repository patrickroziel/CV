"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Wallpaper } from "@/components/background/Wallpaper";
import { AmbientOrbs } from "@/components/background/AmbientOrbs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SupportBar } from "@/components/layout/SupportBar";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { CvPrintView } from "@/components/print/CvPrintView";
import { ComingSoonView } from "@/components/coming-soon/ComingSoonView";
import { DEFAULT_COMING_SOON } from "@/lib/types";
import { universeFromPath } from "@/lib/universe";

/**
 * Shared shell for Work + Notes + Air.
 * Both universes intentionally use the same simple chrome:
 * one top bar, no secondary top navigation, no floating bottom dock.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data, editMode, editAllowed } = usePortfolio();
  const pathname = usePathname();
  const isGhost = Boolean(pathname?.startsWith("/g/"));
  const universe = universeFromPath(pathname);
  const enabled = (data.comingSoon ?? DEFAULT_COMING_SOON).enabled;
  const publicComingSoon = !editMode && !editAllowed && enabled && !isGhost;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.universe = publicComingSoon ? "coming-soon" : isGhost ? "ghost" : universe;
    return () => {
      delete root.dataset.universe;
    };
  }, [universe, publicComingSoon, isGhost]);

  // The private sign-in stays available if the public site is paused.
  if (pathname.startsWith("/behind-the-glass/")) return <>{children}</>;

  if (isGhost) {
    return editMode ? (
      <>
        <Header />
        <div className="relative z-10">{children}</div>
      </>
    ) : (
      <div className="relative z-10">{children}</div>
    );
  }

  if (publicComingSoon) {
    return (
      <>
        <Wallpaper />
        <ComingSoonView />
      </>
    );
  }

  return (
    <>
      <Wallpaper />
      <AmbientOrbs />
      <ScrollProgress />
      <Header />
      <div className="relative z-10">{children}</div>
      <Footer />
      <SupportBar />
      <CvPrintView />
    </>
  );
}

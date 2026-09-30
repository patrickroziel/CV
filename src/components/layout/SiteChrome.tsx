"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Wallpaper } from "@/components/background/Wallpaper";
import { AmbientOrbs } from "@/components/background/AmbientOrbs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { CvPrintView } from "@/components/print/CvPrintView";
import { ComingSoonView } from "@/components/coming-soon/ComingSoonView";
import { DEFAULT_COMING_SOON } from "@/lib/types";
import { universeFromPath } from "@/lib/universe";

/**
 * Shared shell for Work + Notes.
 * Both universes intentionally use the same simple chrome:
 * one top bar, no secondary top navigation, no floating bottom dock.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data, editMode } = usePortfolio();
  const pathname = usePathname();
  const universe = universeFromPath(pathname);
  const enabled = (data.comingSoon ?? DEFAULT_COMING_SOON).enabled;
  const publicComingSoon = !editMode && enabled;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.universe = publicComingSoon ? "coming-soon" : universe;
    return () => {
      delete root.dataset.universe;
    };
  }, [universe, publicComingSoon]);

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
      <CvPrintView />
    </>
  );
}

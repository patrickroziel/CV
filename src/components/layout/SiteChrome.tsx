"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Wallpaper } from "@/components/background/Wallpaper";
import { AmbientOrbs } from "@/components/background/AmbientOrbs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DockNav } from "@/components/layout/DockNav";
import { ScrollProgress } from "@/components/shared/ScrollProgress";
import { WidgetStack } from "@/components/widgets/WidgetStack";
import { CvPrintView } from "@/components/print/CvPrintView";
import { ComingSoonView } from "@/components/coming-soon/ComingSoonView";
import { DEFAULT_COMING_SOON } from "@/lib/types";

/**
 * App shell: wallpaper always on; when Coming Soon is enabled for the public
 * (not edit mode), only the Coming Soon landing is shown.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const { data, editMode } = usePortfolio();
  const enabled = (data.comingSoon ?? DEFAULT_COMING_SOON).enabled;
  /** Public visitors only — Mode Édition always gets the full site */
  const publicComingSoon = !editMode && enabled;

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
      <WidgetStack />
      <div className="relative z-10">{children}</div>
      <Footer />
      <DockNav />
      <CvPrintView />
    </>
  );
}

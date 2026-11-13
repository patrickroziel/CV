"use client";

import { useState } from "react";
import { Eye, FileDown, ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { UniverseSwitch, useUniverse } from "@/components/layout/UniverseSwitch";
import { downloadPortfolioSnapshot } from "@/lib/storage";
import { SiteTranslator } from "@/components/translation/SiteTranslator";
import { GhostPagesButton } from "@/components/ghost/GhostPagesButton";
import { TipsLink } from "@/components/layout/SupportBar";

export function Header() {
  const { editMode, setEditMode, editAllowed, cloudStatus, data, showToast } = usePortfolio();
  const universe = useUniverse();
  const isNotes = universe === "medias";
  const isAir = universe === "air";
  const isLights = universe === "lights";
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  return (
    <header data-editing={editMode ? "true" : undefined} className="no-print fixed inset-x-0 top-0 z-40 border-b border-cyan-100/10 bg-[#031014]/55 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#031014]/42">
      {editMode && (
        <div className="border-b border-cyan-200/10 bg-cyan-200/[0.08] px-3 py-0.5 text-center text-[10px] font-medium leading-tight text-cyan-50/80 sm:px-4 sm:py-1.5 sm:text-[11px]">
          {cloudStatus === "local" ? "Mode édition · sauvegarde locale" : cloudStatus === "saved" ? "Mode édition · synchronisé dans le cloud" : cloudStatus === "saving" ? "Mode édition · sauvegarde en cours…" : "Mode édition · ERREUR CLOUD : exporter une copie JSON"}
        </div>
      )}

      <div className="site-header-bar mx-auto flex h-11 max-w-[1180px] items-center justify-between gap-2 overflow-x-auto px-3 sm:h-16 sm:gap-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <UniverseSwitch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <TipsLink />
          <SiteTranslator />
          <EditGate>
            {!isNotes && !isAir && !isLights && (
              <Button variant="ghost" size="sm" onClick={() => setWallpaperOpen(true)} title="Changer le fond de Work">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Fond</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              title="Exporter tout le contenu, brouillons inclus"
              onClick={() => {
                downloadPortfolioSnapshot(data);
                showToast("Export JSON téléchargé · brouillons inclus");
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Exporter</span>
            </Button>
          </EditGate>

          {editAllowed && <GhostPagesButton />}

          {editAllowed && (
            <Button
              variant={editMode ? "default" : "secondary"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-1.5"
              title={editMode ? "Quitter" : "Modifier"}
              aria-label={editMode ? "Quitter le mode édition" : "Modifier"}
            >
              {editMode ? (
                <><Eye className="h-3.5 w-3.5" /><span className="hidden lg:inline">Quitter</span></>
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      <WallpaperEditor open={wallpaperOpen} onOpenChange={setWallpaperOpen} />
    </header>
  );
}

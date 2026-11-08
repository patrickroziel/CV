"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard, Cloud, Eye, FileDown, ImageIcon, Pencil, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { UniverseSwitch, useUniverse } from "@/components/layout/UniverseSwitch";
import { downloadPortfolioSnapshot } from "@/lib/storage";
import { SiteTranslator } from "@/components/translation/SiteTranslator";
import { GhostPagesButton } from "@/components/ghost/GhostPagesButton";

export function Header() {
  const { editMode, setEditMode, editAllowed, cloudStatus, data, showToast } = usePortfolio();
  const universe = useUniverse();
  const isNotes = universe === "medias";
  const isAir = universe === "air";
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  return (
    <header data-editing={editMode ? "true" : undefined} className="no-print fixed inset-x-0 top-0 z-40 border-b border-cyan-100/10 bg-[#031014]/55 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#031014]/42">
      {editMode && (
        <div className="border-b border-cyan-200/10 bg-cyan-200/[0.08] px-3 py-0.5 text-center text-[10px] font-medium leading-tight text-cyan-50/80 sm:px-4 sm:py-1.5 sm:text-[11px]">
          {cloudStatus === "local" ? "Mode édition · sauvegarde locale" : cloudStatus === "saved" ? "Mode édition · synchronisé dans le cloud" : cloudStatus === "saving" ? "Mode édition · sauvegarde en cours…" : "Mode édition · ERREUR CLOUD : exporter une copie JSON"}
        </div>
      )}

      <div className="mx-auto flex h-11 max-w-[1180px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50"
          >
            <span className="glass-chip flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-cyan-200 shadow-lg sm:h-9 sm:w-9 sm:rounded-2xl">
              {isNotes ? <Radio className="h-4 w-4" /> : isAir ? <Cloud className="h-4 w-4" /> : <Clapperboard className="h-4 w-4" />}
            </span>
            <span className="hidden truncate sm:inline">Patrick Roziel</span>
          </Link>
          <UniverseSwitch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <SiteTranslator />
          <EditGate>
            {!isNotes && !isAir && (
              <Button variant="ghost" size="sm" onClick={() => setWallpaperOpen(true)} title="Changer le fond de Work">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fond</span>
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
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          </EditGate>

          {editAllowed && <GhostPagesButton />}

          {editAllowed && (
            <Button
              variant={editMode ? "default" : "secondary"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="gap-1.5"
            >
              {editMode ? (
                <><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">Quitter</span></>
              ) : (
                <><Pencil className="h-3.5 w-3.5" /><span className="hidden sm:inline">Modifier</span></>
              )}
            </Button>
          )}
        </div>
      </div>

      <WallpaperEditor open={wallpaperOpen} onOpenChange={setWallpaperOpen} />
    </header>
  );
}

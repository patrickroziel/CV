"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard, Eye, FileDown, ImageIcon, Pencil, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { UniverseSwitch, useUniverse } from "@/components/layout/UniverseSwitch";
import { downloadPortfolioSnapshot } from "@/lib/storage";

export function Header() {
  const { editMode, setEditMode, editAllowed, data, showToast } = usePortfolio();
  const universe = useUniverse();
  const isNotes = universe === "medias";
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 border-b border-cyan-100/10 bg-[#031014]/55 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#031014]/42">
      {editMode && (
        <div className="border-b border-cyan-200/10 bg-cyan-200/[0.08] px-4 py-1.5 text-center text-[11px] font-medium text-cyan-50/80">
          Mode édition · les changements sont enregistrés automatiquement sur cet appareil
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={isNotes ? "/notes" : "/"}
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50"
          >
            <span className="glass-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-cyan-200 shadow-lg">
              {isNotes ? <Radio className="h-4 w-4" /> : <Clapperboard className="h-4 w-4" />}
            </span>
            <span className="hidden truncate sm:inline">Patrick Roziel</span>
          </Link>
          <UniverseSwitch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <EditGate>
            {!isNotes && (
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

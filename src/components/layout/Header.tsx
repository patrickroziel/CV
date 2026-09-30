"use client";

import { useState } from "react";
import Link from "next/link";
import { Clapperboard, Eye, FileDown, ImageIcon, Pencil, Radio, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { EditLocaleBar } from "@/components/i18n/EditLocaleBar";
import { ComingSoonSettingsPanel } from "@/components/coming-soon/ComingSoonSettingsPanel";
import { WallpaperEditor } from "@/components/background/WallpaperEditor";
import { UniverseSwitch, useUniverse } from "@/components/layout/UniverseSwitch";
import { downloadPortfolioSnapshot } from "@/lib/storage";
import { DEFAULT_COMING_SOON } from "@/lib/types";

export function Header() {
  const {
    editMode,
    setEditMode,
    editAllowed,
    t,
    data,
    showToast,
    updateComingSoon,
  } = usePortfolio();
  const universe = useUniverse();
  const isNotes = universe === "medias";
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  const comingSoonOn = Boolean(
    (data.comingSoon ?? DEFAULT_COMING_SOON).enabled
  );

  return (
    <header className="no-print fixed inset-x-0 top-0 z-40 border-b border-cyan-100/10 bg-[#031014]/55 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#031014]/42">
      {editMode && (
        <div className="border-b border-cyan-200/10 bg-cyan-200/[0.08] px-4 py-1.5 text-center text-xs font-medium text-cyan-50 backdrop-blur-md">
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            {t("edit.modeOn")}
            <span className="text-cyan-100/35">·</span>
            <button
              type="button"
              onClick={() => updateComingSoon({ enabled: !comingSoonOn })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition",
                comingSoonOn
                  ? "border-amber-300/40 bg-amber-400/20 text-amber-50"
                  : "border-cyan-100/15 bg-black/15 text-cyan-50 hover:bg-black/25"
              )}
              title="Active la page publique Coming Soon"
            >
              <Rocket className="h-3 w-3" />
              Coming Soon : {comingSoonOn ? "ON" : "OFF"}
            </button>
          </span>
        </div>
      )}

      <EditLocaleBar />

      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={isNotes ? "/notes" : "/"}
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-zinc-50"
          >
            <span className="glass-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-cyan-200 shadow-lg">
              {isNotes ? (
                <Radio className="h-4 w-4" />
              ) : (
                <Clapperboard className="h-4 w-4" />
              )}
            </span>
            <span className="hidden truncate sm:inline">Patrick Roziel</span>
          </Link>

          <UniverseSwitch />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!editMode && <LanguageSwitcher compact />}

          <EditGate>
            {!isNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWallpaperOpen(true)}
                title="Changer le fond de Work"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fond</span>
              </Button>
            )}

            <Button
              variant={comingSoonOn ? "default" : "ghost"}
              size="sm"
              className={cn(
                "hidden sm:inline-flex",
                comingSoonOn && "bg-amber-400/90 text-zinc-950 hover:bg-amber-300"
              )}
              onClick={() => setComingSoonOpen(true)}
            >
              <Rocket className="h-3.5 w-3.5" />
              Coming Soon
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              title="Exporter le JSON pour la publication"
              onClick={() => {
                downloadPortfolioSnapshot(data);
                showToast("Snapshot JSON téléchargé");
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              Export JSON
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
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("actions.quit")}</span>
                </>
              ) : (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("actions.edit")}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <ComingSoonSettingsPanel
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
      />
      <WallpaperEditor open={wallpaperOpen} onOpenChange={setWallpaperOpen} />
    </header>
  );
}

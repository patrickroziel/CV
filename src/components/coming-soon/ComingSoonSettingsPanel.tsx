"use client";

import { useEffect, useState } from "react";
import { Download, Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { downloadPortfolioSnapshot } from "@/lib/storage";
import {
  DEFAULT_COMING_SOON,
  type ComingSoonConfig,
} from "@/lib/types";
import { liftToLocalized } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

type ComingSoonSettingsPanelProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

/**
 * Edit Mode controls for public Coming Soon landing.
 * Toggle affects visitors only — Mode Édition always shows the full site.
 * “Publier” exports a snapshot including the flag for production defaults.
 */
export function ComingSoonSettingsPanel({
  open,
  onOpenChange,
}: ComingSoonSettingsPanelProps) {
  const { data, updateComingSoon, showToast } = usePortfolio();
  const [draft, setDraft] = useState<ComingSoonConfig>(
    () => data.comingSoon ?? DEFAULT_COMING_SOON
  );

  useEffect(() => {
    if (open) {
      setDraft({
        enabled: Boolean(data.comingSoon?.enabled),
        title: liftToLocalized(
          data.comingSoon?.title ?? DEFAULT_COMING_SOON.title
        ),
      });
    }
  }, [open, data.comingSoon]);

  const save = () => {
    updateComingSoon({
      enabled: draft.enabled,
      title: liftToLocalized(draft.title),
    });
    onOpenChange(false);
  };

  const publish = () => {
    const next: ComingSoonConfig = {
      enabled: draft.enabled,
      title: liftToLocalized(draft.title),
    };
    updateComingSoon(next);
    // Snapshot includes comingSoon for baking into default-snapshot.json
    downloadPortfolioSnapshot({
      ...data,
      comingSoon: next,
    });
    showToast(
      next.enabled
        ? "Snapshot téléchargé (Coming Soon ON) — remplacez default-snapshot.json et déployez"
        : "Snapshot téléchargé (Coming Soon OFF) — remplacez default-snapshot.json et déployez"
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-amber-300" />
            Coming Soon
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs leading-relaxed text-zinc-500">
          Active une page publique avec uniquement le{" "}
          <strong className="text-zinc-300">fond</strong>, le{" "}
          <strong className="text-zinc-300">showreel</strong> et les{" "}
          <strong className="text-zinc-300">3 cartes feature</strong>. Le Mode
          Édition affiche toujours le site complet pour travailler.
        </p>

        <button
          type="button"
          onClick={() =>
            setDraft((d) => ({ ...d, enabled: !d.enabled }))
          }
          className={cn(
            "mt-2 flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
            draft.enabled
              ? "border-amber-400/40 bg-amber-400/15 text-amber-50"
              : "border-white/12 bg-white/5 text-zinc-200 hover:bg-white/8"
          )}
        >
          <span className="text-sm font-semibold">
            Coming Soon {draft.enabled ? "activé" : "désactivé"}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
              draft.enabled
                ? "bg-amber-300 text-zinc-950"
                : "bg-zinc-700 text-zinc-200"
            )}
          >
            {draft.enabled ? "ON" : "OFF"}
          </span>
        </button>

        <div className="mt-4">
          <LocalizedField
            label="Titre affiché (optionnel)"
            value={draft.title}
            onChange={(title) =>
              setDraft((d) => ({ ...d, title: liftToLocalized(title) }))
            }
            placeholder="Coming soon / Bientôt"
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" onClick={save}>
            Enregistrer
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={publish}
          >
            <Download className="h-4 w-4" />
            Publier l’état Coming Soon
          </Button>
          <p className="text-[10px] leading-relaxed text-zinc-600">
            « Publier » enregistre le flag et télécharge le snapshot JSON. Pour
            la prod : placez-le dans{" "}
            <code className="text-zinc-400">src/lib/default-snapshot.json</code>{" "}
            (ou via votre pipeline) puis déployez. Toggle OFF + publier pour
            rouvrir le site public.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

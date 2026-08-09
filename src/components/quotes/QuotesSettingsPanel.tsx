"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { QuoteService, QuotesConfig } from "@/lib/types";
import { DEFAULT_QUOTES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { normalizeQuotes } from "@/lib/storage";

type QuotesSettingsPanelProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function QuotesSettingsPanel({
  open,
  onOpenChange,
}: QuotesSettingsPanelProps) {
  const { data, updateQuotes } = usePortfolio();
  const [draft, setDraft] = useState<QuotesConfig>(
    () => data.quotes ?? DEFAULT_QUOTES
  );

  useEffect(() => {
    if (open) {
      setDraft(normalizeQuotes(data.quotes ?? DEFAULT_QUOTES));
    }
  }, [open, data.quotes]);

  const updateService = (id: string, partial: Partial<QuoteService>) => {
    setDraft((d) => ({
      ...d,
      services: d.services.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    }));
  };

  const save = () => {
    updateQuotes(normalizeQuotes(draft));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-teal-300" />
            Devis — boutons & pages
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <LocalizedField
            label="Eyebrow section"
            value={draft.sectionEyebrow}
            onChange={(v) => setDraft((d) => ({ ...d, sectionEyebrow: v }))}
          />
          <LocalizedField
            label="Titre section"
            value={draft.sectionTitle}
            onChange={(v) => setDraft((d) => ({ ...d, sectionTitle: v }))}
          />
          <LocalizedField
            label="Description section"
            value={draft.sectionDescription}
            onChange={(v) =>
              setDraft((d) => ({ ...d, sectionDescription: v }))
            }
            multiline
            rows={2}
          />

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Services ({draft.services.length})
          </p>

          {draft.services.map((s, i) => (
            <div
              key={s.id}
              className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                  {i + 1}. {s.id}
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <span>Visible</span>
                  <input
                    type="checkbox"
                    checked={s.show}
                    onChange={(e) =>
                      updateService(s.id, { show: e.target.checked })
                    }
                    className="h-4 w-4 accent-teal-300"
                  />
                </label>
              </div>

              <LocalizedField
                label="Label du bouton"
                value={s.buttonLabel}
                onChange={(v) => updateService(s.id, { buttonLabel: v })}
              />
              <LocalizedField
                label="Titre de la page devis"
                value={s.pageTitle}
                onChange={(v) => updateService(s.id, { pageTitle: v })}
              />
              <LocalizedField
                label="Intro professionnelle"
                value={s.pageIntro}
                onChange={(v) => updateService(s.id, { pageIntro: v })}
                multiline
                rows={3}
              />
              <p className="text-[10px] text-zinc-500">
                URL : /devis/{s.id}
              </p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={save}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

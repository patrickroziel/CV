"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  DEFAULT_NAV,
  NAV_ITEM_IDS,
  NAV_ITEM_META,
  type NavConfig,
  type NavItemId,
} from "@/lib/types";
import { normalizeNav } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { liftToLocalized } from "@/lib/i18n-content";

type NavSettingsPanelProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  focusId?: NavItemId | null;
};

/**
 * Edit Mode: rename sections/nav items + show/hide entire sections.
 * Hidden → invisible for the public + removed from menu; still editable in Mode Édition.
 */
export function NavSettingsPanel({
  open,
  onOpenChange,
  focusId = null,
}: NavSettingsPanelProps) {
  const { data, updateNav, t } = usePortfolio();
  const [draft, setDraft] = useState<NavConfig>(() =>
    normalizeNav(data.nav ?? DEFAULT_NAV)
  );

  useEffect(() => {
    if (open) setDraft(normalizeNav(data.nav ?? DEFAULT_NAV));
  }, [open, data.nav]);

  useEffect(() => {
    if (!open || !focusId) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`nav-edit-${focusId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, focusId]);

  const setItem = (
    id: NavItemId,
    patch: Partial<NavConfig[NavItemId]>
  ) => {
    setDraft((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const save = () => {
    updateNav(normalizeNav(draft));
    onOpenChange(false);
  };

  const resetDefaults = () => {
    setDraft(structuredClone(DEFAULT_NAV));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sections & navigation</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-500">
          Masquez une section pour le public (elle disparaît aussi du menu). En
          Mode Édition elle reste visible avec un badge « Masquée ». Les ancres
          (ex. <code className="text-zinc-400">/#experience</code>) ne changent
          pas.
        </p>

        <ul className="mt-2 grid gap-3">
          {NAV_ITEM_IDS.map((id) => {
            const meta = NAV_ITEM_META.find((m) => m.id === id)!;
            const item = draft[id];
            const focused = focusId === id;
            const inNav = meta.showInNav !== false;
            return (
              <li
                key={id}
                id={`nav-edit-${id}`}
                className={cn(
                  "rounded-2xl border border-white/10 bg-black/25 p-3",
                  focused && "ring-1 ring-teal-300/40",
                  !item.visible && "border-amber-400/25 bg-amber-400/5"
                )}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200">
                      {t(meta.i18nKey)}
                      <span className="ml-2 font-normal text-zinc-500">
                        · {meta.href}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {inNav
                        ? "Section + entrée de menu"
                        : "Section seule (pas dans le menu principal)"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setItem(id, { visible: !item.visible })
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                      item.visible
                        ? "border-teal-300/30 bg-teal-300/10 text-teal-100"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-100"
                    )}
                    title={
                      item.visible
                        ? "Masquer la section pour le public"
                        : "Rendre la section visible"
                    }
                  >
                    {item.visible ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Masquée
                      </>
                    )}
                  </button>
                </div>
                <LocalizedField
                  label="Libellé (menu / badge)"
                  value={item.label}
                  onChange={(label) =>
                    setItem(id, { label: liftToLocalized(label) })
                  }
                  placeholder={t(meta.i18nKey)}
                  id={`nav-label-${id}`}
                />
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={resetDefaults}>
            Réinitialiser les défauts
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={save}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

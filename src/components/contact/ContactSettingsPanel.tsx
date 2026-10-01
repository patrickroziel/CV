"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ContactConfig } from "@/lib/types";

type ContactSettingsPanelProps = { open: boolean; onOpenChange: (v: boolean) => void };

export function ContactSettingsPanel({ open, onOpenChange }: ContactSettingsPanelProps) {
  const { data, updateContact } = usePortfolio();
  const [draft, setDraft] = useState<ContactConfig>(data.contact);

  useEffect(() => {
    if (open) setDraft({ ...data.contact });
  }, [open, data.contact]);

  const set = <K extends keyof ContactConfig>(key: K, value: ContactConfig[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const save = () => {
    updateContact(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-teal-300" />Modifier Contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <LocalizedField label="Petit titre" value={draft.sectionEyebrow} onChange={(v) => set("sectionEyebrow", v)} />
          <LocalizedField label="Titre" value={draft.sectionTitle} onChange={(v) => set("sectionTitle", v)} />
          <LocalizedField label="Texte" value={draft.introText} onChange={(v) => set("introText", v)} multiline rows={3} />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300">
            <span>Afficher le formulaire de contact</span>
            <input type="checkbox" checked={draft.showForm} onChange={(e) => set("showForm", e.target.checked)} />
          </label>
        </div>
        <DialogFooter><Button variant="secondary" onClick={() => onOpenChange(false)}>Annuler</Button><Button onClick={save}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

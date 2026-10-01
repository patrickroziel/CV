"use client";

import { useState } from "react";
import type { Experience } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { getL, liftToLocalized, type LocalizedString } from "@/lib/i18n-content";

export type ExperienceFormValues = Omit<Experience, "id">;

type ExperienceFormProps = {
  initial?: Partial<ExperienceFormValues>;
  onSubmit: (values: ExperienceFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export function ExperienceForm({ initial, onSubmit, onCancel, submitLabel = "Enregistrer" }: ExperienceFormProps) {
  const [role, setRole] = useState<LocalizedString>(liftToLocalized(initial?.role));
  const [company, setCompany] = useState<LocalizedString>(liftToLocalized(initial?.company));
  const [location, setLocation] = useState<LocalizedString>(liftToLocalized(initial?.location));
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate === null ? "" : (initial?.endDate ?? ""));
  const [isPresent, setIsPresent] = useState(initial ? initial.endDate === null : false);
  const [description, setDescription] = useState<LocalizedString>(liftToLocalized(initial?.description));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getL(role, "fr").trim() || !getL(company, "fr").trim() || !startDate.trim()) {
      setError("Poste, entreprise et date de début sont obligatoires.");
      return;
    }
    onSubmit({
      role,
      company,
      location: getL(location, "fr").trim() ? location : undefined,
      startDate: startDate.trim(),
      endDate: isPresent ? null : endDate.trim() || null,
      description,
      technologies: initial?.technologies ?? [],
      media: initial?.media ?? [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <LocalizedField label="Poste *" value={role} onChange={setRole} placeholder="Monteur vidéo" />
      <LocalizedField label="Entreprise *" value={company} onChange={setCompany} placeholder="Entreprise" />
      <LocalizedField label="Lieu" value={location} onChange={setLocation} placeholder="Paris" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="start">Début *</Label>
          <Input id="start" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="2023-03" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end">Fin</Label>
          <Input id="end" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="2024-12" disabled={isPresent} />
          <label className="flex items-center gap-2 text-xs text-zinc-400"><input type="checkbox" checked={isPresent} onChange={(e) => setIsPresent(e.target.checked)} />Poste actuel</label>
        </div>
      </div>
      <LocalizedField label="Description" value={description} onChange={setDescription} multiline rows={8} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button><Button type="submit">{submitLabel}</Button></div>
    </form>
  );
}

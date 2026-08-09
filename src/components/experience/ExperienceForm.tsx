"use client";

import { useState } from "react";
import type { Experience, MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaCarouselEditor } from "@/components/shared/MediaCarouselEditor";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";

export type ExperienceFormValues = Omit<Experience, "id">;

type ExperienceFormProps = {
  initial?: Partial<ExperienceFormValues>;
  onSubmit: (values: ExperienceFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export function ExperienceForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: ExperienceFormProps) {
  const [role, setRole] = useState<LocalizedString>(
    liftToLocalized(initial?.role)
  );
  const [company, setCompany] = useState<LocalizedString>(
    liftToLocalized(initial?.company)
  );
  const [location, setLocation] = useState<LocalizedString>(
    liftToLocalized(initial?.location)
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(
    initial?.endDate === null ? "" : (initial?.endDate ?? "")
  );
  const [isPresent, setIsPresent] = useState(
    initial ? initial.endDate === null : false
  );
  const [description, setDescription] = useState<LocalizedString>(
    liftToLocalized(initial?.description)
  );
  const [tech, setTech] = useState((initial?.technologies ?? []).join(", "));
  const [media, setMedia] = useState<MediaItem[]>(initial?.media ?? []);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getL(role).trim() || !getL(company).trim() || !startDate.trim()) {
      setError("Rôle, entreprise et date de début sont obligatoires.");
      return;
    }
    onSubmit({
      role,
      company,
      location: getL(location).trim() ? location : undefined,
      startDate: startDate.trim(),
      endDate: isPresent ? null : endDate.trim() || null,
      description,
      technologies: tech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      media,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizedField
          label="Poste *"
          value={role}
          onChange={setRole}
          placeholder="Monteur vidéo"
          id="role"
        />
        <LocalizedField
          label="Entreprise *"
          value={company}
          onChange={setCompany}
          placeholder="SAV"
          id="company"
        />
      </div>
      <LocalizedField
        label="Lieu"
        value={location}
        onChange={setLocation}
        placeholder="Paris"
        id="location"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="start">Début * (AAAA ou AAAA-MM)</Label>
          <Input
            id="start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="2023-03"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end">Fin</Label>
          <Input
            id="end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="2024-12"
            disabled={isPresent}
          />
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={isPresent}
              onChange={(e) => setIsPresent(e.target.checked)}
              className="rounded border-white/20"
            />
            Poste actuel
          </label>
        </div>
      </div>
      <LocalizedField
        label="Description"
        value={description}
        onChange={setDescription}
        multiline
        rows={8}
        id="desc"
      />
      <div className="grid gap-2">
        <Label htmlFor="tech">Technologies (virgules)</Label>
        <Input
          id="tech"
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="Premiere Pro, After Effects"
        />
      </div>

      <MediaCarouselEditor items={media} onChange={setMedia} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

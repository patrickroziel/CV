"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { EditableSectionHeading } from "@/components/shared/EditableSectionHeading";
import { DEFAULT_SECTION_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/glass/GlassCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaCarousel } from "@/components/shared/MediaCarousel";
import { MediaCarouselEditor } from "@/components/shared/MediaCarouselEditor";
import type { Education, MediaItem } from "@/lib/types";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { LocalizedField } from "@/components/i18n/LocalizedField";

export function EducationSection() {
  const {
    data,
    addEducation,
    updateEducation,
    removeEducation,
    editMode,
    l,
    t,
    updateSectionLabels,
  } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Education | null>(null);
  const [year, setYear] = useState("");
  const [degree, setDegree] = useState<LocalizedString>({});
  const [school, setSchool] = useState<LocalizedString>({});
  const [media, setMedia] = useState<MediaItem[]>([]);

  const resetForm = () => {
    setYear("");
    setDegree({});
    setSchool({});
    setMedia([]);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (edu: Education) => {
    setEditing(edu);
    setYear(edu.year);
    setDegree(liftToLocalized(edu.degree));
    setSchool(liftToLocalized(edu.school));
    setMedia(edu.media ?? []);
    setOpen(true);
  };

  const handleSave = () => {
    if (!year.trim() || !getL(degree).trim() || !getL(school).trim()) return;
    const payload = {
      year: year.trim(),
      degree,
      school,
      media,
    };
    if (editing) {
      updateEducation(editing.id, payload);
    } else {
      addEducation(payload);
    }
    setOpen(false);
    resetForm();
  };

  return (
    <section id="education" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EditableSectionHeading
          eyebrow={
            data.sectionLabels?.educationEyebrow ??
            DEFAULT_SECTION_LABELS.educationEyebrow
          }
          onEyebrowChange={(educationEyebrow) =>
            updateSectionLabels({ educationEyebrow })
          }
          title={t("sections.educationTitle")}
          descriptionFallback={t("sections.educationDesc")}
          action={
            <EditGate>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("actions.add")}
              </Button>
            </EditGate>
          }
        />

        <div className="grid gap-4">
          {data.education.map((edu, i) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <GlassCard glow className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-300/10 text-teal-300">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-amber-400">
                          {edu.year}
                        </p>
                        <h3 className="mt-0.5 font-semibold text-zinc-50">
                          {l(edu.degree)}
                        </h3>
                        <p className="text-sm text-zinc-400">{l(edu.school)}</p>
                      </div>
                      {editMode && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(edu)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Supprimer ?"))
                                removeEducation(edu.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {edu.media && edu.media.length > 0 && (
                      <div className="mt-4">
                        <MediaCarousel items={edu.media} compact />
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la formation" : "Nouvelle formation"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <LocalizedField
              label="Diplôme"
              value={degree}
              onChange={setDegree}
              id="degree"
            />
            <LocalizedField
              label="École"
              value={school}
              onChange={setSchool}
              id="school"
            />
            <MediaCarouselEditor items={media} onChange={setMedia} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

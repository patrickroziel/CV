"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { EditableSectionHeading } from "@/components/shared/EditableSectionHeading";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import { SkillTag } from "@/components/skills/SkillTag";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExperienceForm,
  type ExperienceFormValues,
} from "@/components/experience/ExperienceForm";
import { MediaCarousel } from "@/components/shared/MediaCarousel";
import { RichHtml } from "@/components/shared/RichHtml";
import { formatPeriod } from "@/lib/utils";
import type { Experience } from "@/lib/types";
import { DEFAULT_SECTION_LABELS } from "@/lib/types";

function sortExperiences(list: Experience[]) {
  return [...list].sort((a, b) => {
    const aEnd = a.endDate ?? "9999-12";
    const bEnd = b.endDate ?? "9999-12";
    if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
    return b.startDate.localeCompare(a.startDate);
  });
}

export function ExperienceSection() {
  const {
    data,
    addExperience,
    updateExperience,
    removeExperience,
    updateSectionLabels,
    editMode,
    l,
    t,
  } = usePortfolio();
  const experiences = useMemo(
    () => sortExperiences(data.experiences),
    [data.experiences]
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);

  return (
    <section id="experience" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EditableSectionHeading
          eyebrow={
            data.sectionLabels?.experienceEyebrow ??
            DEFAULT_SECTION_LABELS.experienceEyebrow
          }
          onEyebrowChange={(experienceEyebrow) =>
            updateSectionLabels({ experienceEyebrow })
          }
          title={t("sections.experienceTitle")}
          descriptionFallback={t("sections.experienceDesc")}
          action={
            <EditGate>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("actions.add")}
              </Button>
            </EditGate>
          }
        />

        <GlassCard className="p-6 sm:p-8">
          {experiences.length === 0 ? (
            <p className="py-8 text-center text-zinc-400">
              {t("sections.experienceEmpty")}
            </p>
          ) : (
            <div className="relative">
              <div
                aria-hidden
                className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-teal-300/70 via-white/15 to-transparent sm:left-[15px]"
              />
              <ul className="space-y-5">
                {experiences.map((exp, i) => (
                  <motion.li
                    key={exp.id}
                    id={`experience-${exp.id}`}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(i * 0.04, 0.3),
                    }}
                    className="relative scroll-mt-28 pl-10 sm:pl-12"
                  >
                    <span className="absolute left-0 top-5 flex h-6 w-6 items-center justify-center sm:h-8 sm:w-8">
                      <span className="h-3 w-3 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.7)] ring-4 ring-teal-300/20" />
                    </span>
                    <GlassCard nested glow className="group p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-medium tracking-tight text-zinc-50 sm:text-[1.05rem]">
                            {l(exp.role)}
                          </h3>
                          <p className="mt-0.5 text-sm font-normal text-amber-300/90">
                            {l(exp.company)}
                            {exp.location && l(exp.location)
                              ? ` · ${l(exp.location)}`
                              : ""}
                          </p>
                          <p className="mt-1.5 text-xs text-zinc-500">
                            {formatPeriod(exp.startDate, exp.endDate)}
                          </p>
                        </div>
                        {editMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 opacity-60 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditing(exp)}
                              >
                                <Pencil />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 focus:text-red-300"
                                onClick={() => {
                                  if (confirm("Supprimer cette expérience ?")) {
                                    removeExperience(exp.id);
                                  }
                                }}
                              >
                                <Trash2 />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {l(exp.description) && (
                        <RichHtml
                          html={l(exp.description)}
                          className="experience-copy mt-4 text-[0.95rem] text-zinc-300/90"
                        />
                      )}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {exp.technologies.map((t) => (
                            <SkillTag key={t} label={t} variant="secondary" />
                          ))}
                        </div>
                      )}
                      {editMode && exp.media && exp.media.length > 0 && (
                        <div className="mt-4">
                          <MediaCarousel items={exp.media} compact />
                        </div>
                      )}
                    </GlassCard>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle expérience</DialogTitle>
          </DialogHeader>
          <ExperienceForm
            onSubmit={(values: ExperienceFormValues) => {
              addExperience(values);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            submitLabel="Ajouter"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      >
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l’expérience</DialogTitle>
          </DialogHeader>
          {editing && (
            <ExperienceForm
              initial={editing}
              onSubmit={(values) => {
                updateExperience(editing.id, values);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

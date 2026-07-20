"use client";

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkillIconsRow } from "@/components/skills/SkillIconsRow";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { Skill } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type SkillDetailModalProps = {
  skill: Skill | null;
  /** Original clicked label (when no fiche match) */
  label?: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editMode: boolean;
  matched: boolean;
  onEdit: () => void;
};

/** Shared glass detail card for any skill tag site-wide */
export function SkillDetailModal({
  skill,
  label,
  open,
  onOpenChange,
  editMode,
  matched,
  onEdit,
}: SkillDetailModalProps) {
  const { l } = usePortfolio();
  const display = skill ?? {
    id: "empty",
    name: label?.trim() || "Compétence",
  };
  const name = l(display.name);
  const category = display.category ? l(display.category) : "";
  const description = display.description ? l(display.description) : "";
  const level = display.level ?? 0;
  const hasContent =
    Boolean(description.trim()) ||
    Boolean(display.image) ||
    Boolean(display.icons?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0 sm:rounded-3xl">
        <div className="relative">
          {display.image ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={display.image}
                alt={name}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            </div>
          ) : (
            <div className="h-16 bg-gradient-to-br from-teal-400/15 via-transparent to-amber-400/10" />
          )}

          <div
            className={cn(
              "space-y-4 p-6",
              display.image && "relative z-[1] -mt-10"
            )}
          >
            <DialogHeader className="space-y-3 text-left">
              <div className="flex flex-wrap items-center gap-2">
                {category && <Badge variant="amber">{category}</Badge>}
                {matched && typeof display.level === "number" && (
                  <Badge variant="default">{level}%</Badge>
                )}
                {!matched && (
                  <Badge variant="secondary">Sans fiche détaillée</Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-50">
                {name}
              </DialogTitle>
            </DialogHeader>

            {display.icons && display.icons.length > 0 && (
              <SkillIconsRow icons={display.icons} size="lg" />
            )}

            {description.trim() ? (
              <p className="text-sm leading-relaxed text-zinc-300">
                {description}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">
                {matched
                  ? "Aucune description pour l’instant."
                  : "Cette étiquette n’est pas encore liée à une compétence du portfolio."}
                {editMode && (
                  <span className="mt-1 block text-zinc-400">
                    {matched
                      ? "Cliquez sur « Modifier » pour ajouter un texte, une photo et des icônes."
                      : "Cliquez sur « Créer la fiche » pour l’ajouter aux compétences."}
                  </span>
                )}
                {!hasContent && !editMode && matched ? null : null}
              </p>
            )}

            {matched && typeof display.level === "number" && (
              <div>
                <div className="mb-1.5 flex justify-between text-[11px] uppercase tracking-wider text-zinc-500">
                  <span>Niveau</span>
                  <span className="text-teal-300">{level}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 via-teal-300 to-amber-200/90"
                    initial={{ width: 0 }}
                    animate={{ width: `${level}%` }}
                    transition={{ duration: 0.7, ease: EASE }}
                    style={{ boxShadow: "0 0 14px rgba(94,234,212,0.4)" }}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
              {editMode && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  {matched ? "Modifier" : "Créer la fiche"}
                </Button>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

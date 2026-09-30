"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useSkillDetail } from "@/components/skills/SkillDetailProvider";
import { EditGate } from "@/components/shared/EditGate";
import { EditableSectionHeading } from "@/components/shared/EditableSectionHeading";
import { Button } from "@/components/ui/button";
import type { Skill } from "@/lib/types";
import { DEFAULT_SECTION_LABELS } from "@/lib/types";
import { getL } from "@/lib/i18n-content";

const CATEGORY_ORDER = [
  "Montage vidéo",
  "Motion design",
  "Vidéo réseaux sociaux",
  "Graphisme",
  "Autres",
];

function categoryStableKey(category: Skill["category"]): string {
  if (category == null) return "Autres";
  if (typeof category === "string") return category.trim() || "Autres";

  const fr = category.fr?.trim();
  if (fr) return fr;

  for (const loc of ["en", "pl", "es"] as const) {
    const value = category[loc]?.trim();
    if (value) return value;
  }

  return "Autres";
}

export function SkillsSection() {
  const { data, updateSectionLabels, t, locale } = usePortfolio();
  const { openSkillEditor } = useSkillDetail();

  const categories = useMemo(() => {
    const labels = new Map<string, string>();

    for (const skill of data.skills) {
      const key = categoryStableKey(skill.category);
      const label = getL(skill.category, locale) || getL(skill.category, "fr") || key;
      labels.set(key, label);
    }

    const orderedKeys = [
      ...CATEGORY_ORDER.filter((key) => labels.has(key)),
      ...[...labels.keys()].filter((key) => !CATEGORY_ORDER.includes(key)),
    ];

    return orderedKeys.map((key) => ({ key, label: labels.get(key) ?? key }));
  }, [data.skills, locale]);

  return (
    <section id="skills" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EditableSectionHeading
          eyebrow={
            data.sectionLabels?.skillsEyebrow ??
            DEFAULT_SECTION_LABELS.skillsEyebrow
          }
          onEyebrowChange={(skillsEyebrow) =>
            updateSectionLabels({ skillsEyebrow })
          }
          title={t("sections.skillsTitle")}
          descriptionFallback={t("sections.skillsDesc")}
          action={
            <EditGate>
              <Button onClick={() => openSkillEditor()}>
                <Plus className="h-4 w-4" />
                {t("actions.manage")}
              </Button>
            </EditGate>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4"
        >
          {categories.map((category, index) => (
            <div key={category.key} className="flex items-baseline gap-4 sm:gap-6">
              <span className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl lg:text-[1.7rem]">
                {category.label}
              </span>
              {index < categories.length - 1 && (
                <span aria-hidden className="text-lg font-light text-teal-300/35">
                  / 
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

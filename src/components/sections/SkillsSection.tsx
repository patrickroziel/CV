"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { useSkillDetail } from "@/components/skills/SkillDetailProvider";
import { EditGate } from "@/components/shared/EditGate";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import type { Skill } from "@/lib/types";
import { getL } from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const CATEGORY_ORDER = [
  "Montage vidéo",
  "Motion design",
  "Vidéo réseaux sociaux",
  "Graphisme",
  "Autres",
];

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.12 },
  },
};

const skillRowVariants: Variants = {
  hidden: { opacity: 0, x: -10, y: 6 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

function SkillRow({
  skill,
  editMode,
  reduceMotion,
  onOpen,
  onEdit,
  onDelete,
}: {
  skill: Skill;
  editMode: boolean;
  reduceMotion: boolean | null;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { l } = usePortfolio();
  const [hover, setHover] = useState(false);
  const level = skill.level ?? 0;
  const hasDetail = Boolean(
    getL(skill.description).trim() ||
      skill.image ||
      (skill.icons && skill.icons.length > 0)
  );

  return (
    <motion.li
      variants={skillRowVariants}
      layout
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="list-none"
    >
      <motion.button
        type="button"
        onClick={onOpen}
        animate={
          reduceMotion
            ? undefined
            : {
                backgroundColor: hover
                  ? "rgba(94,234,212,0.12)"
                  : "rgba(255,255,255,0.02)",
                borderColor: hover
                  ? "rgba(94,234,212,0.45)"
                  : "rgba(255,255,255,0.1)",
                x: hover ? 4 : 0,
                scale: hover ? 1.015 : 1,
                boxShadow: hover
                  ? "0 10px 32px -12px rgba(0,0,0,0.5), 0 0 28px -6px rgba(94,234,212,0.35), inset 0 1px 0 0 rgba(255,255,255,0.14)"
                  : "0 0 0 0 transparent, inset 0 1px 0 0 rgba(255,255,255,0.04)",
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 320, damping: 28, mass: 0.55 }
        }
        className={cn(
          "w-full rounded-2xl border px-3 py-2.5 text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-teal-300/50",
          "cursor-pointer"
        )}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {skill.icons?.[0] && (
              <span className="glass-chip flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm">
                {skill.icons[0].src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={skill.icons[0].src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  skill.icons[0].emoji || "•"
                )}
              </span>
            )}
            <motion.span
              animate={{
                color: hover ? "rgba(255,255,255,1)" : "rgba(228,228,231,1)",
              }}
              transition={{ duration: 0.3, ease: EASE }}
              className="truncate text-sm font-medium"
            >
              {l(skill.name)}
            </motion.span>
            {hasDetail && (
              <motion.span
                animate={{ opacity: hover ? 1 : 0.45, scale: hover ? 1.05 : 1 }}
                className="shrink-0 text-teal-300/80"
                title="Voir le détail"
              >
                <Sparkles className="h-3 w-3" />
              </motion.span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <motion.span
              animate={{
                color: hover
                  ? "rgba(94,234,212,1)"
                  : "rgba(113,113,122,1)",
                scale: hover ? 1.06 : 1,
              }}
              transition={{ duration: 0.3, ease: EASE }}
              className="text-xs font-medium tabular-nums"
            >
              {level}%
            </motion.span>
            <AnimatePresence initial={false}>
              {editMode && (
                <motion.div
                  key="edit-actions"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="flex gap-0.5 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-teal-300"
                    aria-label="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-red-400"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-teal-400 via-teal-300 to-amber-200/90"
            )}
            initial={{ width: 0 }}
            whileInView={{ width: `${level}%` }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
            style={{
              boxShadow: hover
                ? "0 0 16px rgba(94,234,212,0.65)"
                : "0 0 0 rgba(94,234,212,0)",
              transition: reduceMotion
                ? undefined
                : "box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
          <AnimatePresence>
            {!reduceMotion && hover && (
              <motion.div
                key="sheen"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-10 rounded-full bg-gradient-to-r from-transparent via-white/45 to-transparent"
                initial={{ x: "-60%", opacity: 0 }}
                animate={{ x: "280%", opacity: [0, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85, ease: EASE }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </motion.li>
  );
}

function SkillCategoryCard({
  category,
  skills,
  editMode,
  reduceMotion,
  onOpen,
  onEdit,
  onDelete,
}: {
  category: string;
  skills: Skill[];
  editMode: boolean;
  reduceMotion: boolean | null;
  onOpen: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="h-full"
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                y: hover ? -5 : 0,
                boxShadow: hover
                  ? "0 24px 48px -18px rgba(0,0,0,0.65), 0 0 40px -12px rgba(94,234,212,0.16)"
                  : "0 16px 40px -20px rgba(0,0,0,0.4)",
                scale: hover ? 1.008 : 1,
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 280, damping: 28, mass: 0.65 }
        }
        className="h-full will-change-transform"
      >
        <GlassCard className="h-full p-6 !transition-none">
          <motion.h3
            animate={{
              color: hover
                ? "rgba(251,191,36,1)"
                : "rgba(251,191,36,0.9)",
            }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mb-5 text-sm font-semibold uppercase tracking-widest"
          >
            {category}
          </motion.h3>

          <motion.ul
            className="space-y-2"
            variants={listVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-30px" }}
          >
            {skills.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                editMode={editMode}
                reduceMotion={reduceMotion}
                onOpen={() => onOpen(skill)}
                onEdit={() => onEdit(skill)}
                onDelete={() => {
                  if (confirm("Supprimer ?")) onDelete(skill.id);
                }}
              />
            ))}
          </motion.ul>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

export function SkillsSection() {
  const { data, removeSkill, editMode, l, t, locale } = usePortfolio();
  const { openSkillDetail, openSkillEditor } = useSkillDetail();
  const reduceMotion = useReducedMotion();

  const grouped = useMemo(() => {
    // Group by French key for stable order; display localized label
    const map = new Map<string, { label: string; skills: Skill[] }>();
    for (const s of data.skills) {
      const key = getL(s.category, "fr") || "Autres";
      const label = getL(s.category, locale) || key;
      if (!map.has(key)) map.set(key, { label, skills: [] });
      map.get(key)!.skills.push(s);
      map.get(key)!.label = label;
    }
    const keys = [
      ...CATEGORY_ORDER.filter((c) => map.has(c)),
      ...[...map.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
    return keys.map((k) => ({
      category: map.get(k)!.label,
      skills: map.get(k)!.skills,
    }));
  }, [data.skills, locale]);

  return (
    <section id="skills" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("sections.skillsEyebrow")}
          title={t("sections.skillsTitle")}
          description={t("sections.skillsDesc")}
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
          className="grid gap-6 lg:grid-cols-2"
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {grouped.map((group) => (
            <SkillCategoryCard
              key={group.category}
              category={group.category}
              skills={group.skills}
              editMode={editMode}
              reduceMotion={reduceMotion}
              onOpen={(skill) => openSkillDetail(skill.id)}
              onEdit={(skill) => openSkillEditor({ skill })}
              onDelete={removeSkill}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

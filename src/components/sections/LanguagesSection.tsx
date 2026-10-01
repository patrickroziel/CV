"use client";

import { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Film,
  Flag,
  Landmark,
  Languages,
  Link2,
  Map,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { EditableSectionHeading } from "@/components/shared/EditableSectionHeading";
import { DEFAULT_SECTION_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { VideoUpload } from "@/components/shared/VideoUpload";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { SvgUpload } from "@/components/shared/SvgUpload";
import {
  LanguageHoverVideo,
  type LanguageHoverVideoHandle,
} from "@/components/languages/LanguageHoverVideo";
import { LanguageIconCarousel } from "@/components/languages/LanguageIconCarousel";
import { LanguageRegionsMap } from "@/components/languages/LanguageRegionsMap";
import type {
  Language,
  LanguageIconItem,
  LanguageIconKind,
  LanguageOutline,
  LanguageVideoType,
} from "@/lib/types";
import { DEFAULT_OUTLINE_COLOR } from "@/lib/types";
import {
  countryCulture,
  countryMonuments,
  defaultIconsForRegions,
  defaultRegionsForLanguage,
  filterIconsToRegions,
  normalizeRegionCodes,
  REGION_CODES,
  REGION_LABELS,
  regionFlag,
} from "@/lib/language-regions";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import {
  fillMissingLocales,
  localizedRegionLabel,
} from "@/lib/auto-localize";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { cn, createId, isXUrl, isYoutubeUrl } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const cardGridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE },
  },
};

const VIDEO_OPTIONS: {
  type: LanguageVideoType;
  label: string;
  icon: typeof Film;
}[] = [
  { type: "none", label: "Aucune", icon: Languages },
  { type: "file", label: "Upload", icon: Film },
  { type: "youtube", label: "YouTube", icon: Video },
  { type: "x", label: "X", icon: Link2 },
];

const ICON_KINDS: {
  kind: LanguageIconKind;
  label: string;
  icon: typeof Flag;
}[] = [
  { kind: "flag", label: "Drapeau", icon: Flag },
  { kind: "monument", label: "Monument", icon: Landmark },
  { kind: "culture", label: "Culture", icon: Sparkles },
  { kind: "outline", label: "Contour", icon: Map },
  { kind: "upload", label: "Upload", icon: Upload },
];

function LanguageCard({
  lang,
  editMode,
  onEdit,
  onDelete,
  totalCount = 3,
}: {
  lang: Language;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  totalCount?: number;
}) {
  const { l } = usePortfolio();
  void totalCount;

  const mainRegion =
    lang.primaryRegion ||
    lang.regions?.[0] ||
    lang.icons?.find(
      (item) => item.kind === "flag" && Boolean(item.region)
    )?.region ||
    "FR";

  const flag = regionFlag(mainRegion.toUpperCase());
  const level = l(lang.level).trim();

  return (
    <motion.div variants={cardItemVariants} className="h-full">
      <GlassCard className="relative flex h-full min-h-[145px] flex-col p-5 sm:p-6">
        {editMode && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Modifier la langue"
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="rounded-full p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-300"
              aria-label="Supprimer la langue"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className={cn("flex items-start gap-4", editMode && "pr-14")}>
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl shadow-inner"
            aria-hidden
          >
            {flag}
          </div>

          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
              {l(lang.name)}
            </h3>

            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Niveau
            </p>

            <p className="mt-1.5 text-sm leading-6 text-zinc-400">
              {level || "Niveau à préciser"}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function LanguagesSection() {
  const {
    data,
    addLanguage,
    updateLanguage,
    removeLanguage,
    updateSectionLabels,
    editMode,
    editingLocale,
    l,
    t,
  } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [name, setName] = useState<LocalizedString>({});
  const [level, setLevel] = useState<LocalizedString>(
    liftToLocalized("Courant")
  );
  const [videoType, setVideoType] = useState<LanguageVideoType>("none");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [icons, setIcons] = useState<LanguageIconItem[]>([]);
  const [outlines, setOutlines] = useState<LanguageOutline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName({});
    setLevel({
      fr: "Courant",
      en: "Fluent",
      pl: "Biegły",
      es: "Fluido",
    });
    setVideoType("none");
    setVideoUrl(null);
    setFallbackImageUrl(null);
    setLinkInput("");
    setIcons([{ id: createId(), kind: "flag", region: "FR" }]);
    setOutlines([
      { id: createId(), code: "FR", label: localizedRegionLabel("FR") },
      { id: createId(), code: "BE", label: localizedRegionLabel("BE") },
      { id: createId(), code: "CH", label: localizedRegionLabel("CH") },
    ]);
    setEditing(null);
    setError(null);
    setSaving(false);
  };

  const openEdit = (lang: Language) => {
    setEditing(lang);
    setName(liftToLocalized(lang.name));
    setLevel(liftToLocalized(lang.level));
    setVideoType(lang.videoType ?? "none");
    setVideoUrl(lang.videoUrl ?? null);
    setFallbackImageUrl(lang.fallbackImageUrl ?? null);
    setLinkInput(
      lang.videoType === "youtube" || lang.videoType === "x"
        ? lang.videoUrl ?? ""
        : ""
    );
    setIcons(
      lang.icons?.length
        ? lang.icons.map((i) => ({ ...i }))
        : [
            {
              id: createId(),
              kind: (lang.iconStyle as LanguageIconKind) || "flag",
              region: lang.primaryRegion || "FR",
            },
          ]
    );
    setOutlines(
      lang.outlines?.length
        ? lang.outlines.map((o) => ({ ...o }))
        : (lang.regions || ["FR"]).map((code) => ({
            id: createId(),
            code,
            label: REGION_LABELS[code] || code,
          }))
    );
    setError(null);
    setOpen(true);
  };

  /** Countries currently linked to this language (from outlines + primary) */
  const allowedRegionCodes = normalizeRegionCodes(
    outlines
      .map((o) => o.code)
      .filter((c): c is string => Boolean(c))
  );

  const suggestedRegions = normalizeRegionCodes(
    defaultRegionsForLanguage(getL(name) || "Français").regions
  );

  const handleNameBlur = () => {
    if (editing) return;
    // Only auto-fill countries when the form still has none
    if (outlines.length > 0) return;
    const d = defaultRegionsForLanguage(getL(name));
    const regions = normalizeRegionCodes(d.regions);
    if (regions.length === 0) return;
    setOutlines(
      regions.map((code) => ({
        id: createId(),
        code,
        label: localizedRegionLabel(code),
      }))
    );
    setIcons(defaultIconsForRegions(regions, createId()));
  };

  const updateIcon = (id: string, partial: Partial<LanguageIconItem>) => {
    setIcons((list) =>
      list.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...partial };
        // Keep emoji coherent with country
        if (next.region && next.kind === "monument") {
          const mon = countryMonuments(next.region);
          if (!next.emoji || !mon.includes(next.emoji)) next.emoji = mon[0];
        }
        if (next.region && next.kind === "culture") {
          const cul = countryCulture(next.region);
          if (!next.emoji || !cul.includes(next.emoji)) next.emoji = cul[0];
        }
        return next;
      })
    );
  };

  const addIcon = (kind: LanguageIconKind) => {
    const region = allowedRegionCodes[0] || "FR";
    setIcons((list) => [
      ...list,
      {
        id: createId(),
        kind,
        region,
        emoji:
          kind === "monument"
            ? countryMonuments(region)[0]
            : kind === "culture"
              ? countryCulture(region)[0]
              : undefined,
        src: null,
      },
    ]);
  };

  const moveIcon = (index: number, dir: -1 | 1) => {
    setIcons((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const updateOutline = (id: string, partial: Partial<LanguageOutline>) => {
    setOutlines((list) =>
      list.map((o) => (o.id === id ? { ...o, ...partial } : o))
    );
  };

  /** Toggle a country in / out of the language (drives “pays autorisés”) */
  const toggleRegionCode = (rawCode: string) => {
    const code = rawCode.toUpperCase();
    if (!REGION_CODES.includes(code)) return;

    setOutlines((list) => {
      const exists = list.some(
        (o) => (o.code || "").toUpperCase() === code
      );
      if (exists) {
        // Remove all outlines for this country (built-in path)
        return list.filter(
          (o) => (o.code || "").toUpperCase() !== code || o.customSvg
        );
      }
      return [
        ...list,
        {
          id: createId(),
          code,
          label: localizedRegionLabel(code),
        },
      ];
    });
  };

  const applySuggestedRegions = () => {
    const regions = normalizeRegionCodes(
      defaultRegionsForLanguage(getL(name) || "Français").regions
    );
    if (regions.length === 0) return;
    setOutlines(
      regions.map((code) => ({
        id: createId(),
        code,
        label: localizedRegionLabel(code),
      }))
    );
    setIcons(defaultIconsForRegions(regions, createId()));
  };

  const handleSave = async () => {
    if (!getL(name, "fr").trim() || !getL(level, "fr").trim()) {
      setError("Nom et niveau sont obligatoires.");
      return;
    }

    const fallbackRegion = editing?.primaryRegion || editing?.regions?.[0] || "FR";
    const payload = {
      name,
      level,
      videoType: editing?.videoType ?? "none" as LanguageVideoType,
      videoUrl: editing?.videoUrl ?? null,
      fallbackImageUrl: editing?.fallbackImageUrl ?? null,
      icons: editing?.icons ?? [{ id: createId(), kind: "flag" as LanguageIconKind, region: fallbackRegion }],
      outlines: editing?.outlines ?? [],
      primaryRegion: fallbackRegion,
      regions: editing?.regions ?? [fallbackRegion],
    };

    if (editing) updateLanguage(editing.id, payload);
    else addLanguage(payload);
    setOpen(false);
    resetForm();
  };

  return (
    <section id="languages" className="relative z-10 pb-8 sm:pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EditableSectionHeading
          eyebrow={
            data.sectionLabels?.languagesEyebrow ??
            DEFAULT_SECTION_LABELS.languagesEyebrow
          }
          onEyebrowChange={(languagesEyebrow) =>
            updateSectionLabels({ languagesEyebrow })
          }
          title={t("sections.languagesTitle")}
          description={
            data.sectionLabels?.languagesDescription ??
            DEFAULT_SECTION_LABELS.languagesDescription
          }
          onDescriptionChange={(languagesDescription) =>
            updateSectionLabels({ languagesDescription })
          }
          descriptionFallback={t("sections.languagesDesc")}
          action={
            <EditGate>
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {t("actions.add")}
              </Button>
            </EditGate>
          }
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          variants={cardGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {data.languages.map((lang) => (
            <div key={lang.id} className="min-w-0">
              <LanguageCard
                lang={lang}
                editMode={editMode}
                totalCount={data.languages.length}
                onEdit={() => openEdit(lang)}
                onDelete={() => {
                  if (confirm("Supprimer cette langue ?")) {
                    removeLanguage(lang.id);
                  }
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent size="form">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la langue" : "Ajouter une langue"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <LocalizedField
              label="Langue"
              value={name}
              onChange={setName}
              placeholder="Français"
            />
            <LocalizedField
              label="Niveau / explication"
              value={level}
              onChange={setLevel}
              placeholder="Ex. Courant"
            />
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Les anciens réglages visuels sont conservés, mais ils ne sont plus proposés dans l’éditeur.
            </p>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={() => void handleSave()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

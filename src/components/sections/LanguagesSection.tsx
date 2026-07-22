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
}: {
  lang: Language;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { l, t } = usePortfolio();
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [inView, setInView] = useState(false);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const demoVideoRef = useRef<LanguageHoverVideoHandle>(null);
  const hasVideo = lang.videoType !== "none" && Boolean(lang.videoUrl);
  const videoPlaying = hasVideo && hover;

  const startDemo = useCallback(() => {
    setHover(true);
    // Call play in the same user-gesture turn (hover) so audio is allowed
    demoVideoRef.current?.playUnmuted();
  }, []);

  const stopDemo = useCallback(() => {
    setHover(false);
    demoVideoRef.current?.stop();
  }, []);
  const outlines =
    lang.outlines?.length > 0
      ? lang.outlines
      : (lang.regions || []).map((code, i) => ({
          id: `r-${code}-${i}`,
          code,
          label: REGION_LABELS[code] || code,
        }));
  const allowedRegions = outlines
    .map((o) => o.code)
    .filter((c): c is string => Boolean(c));
  const icons =
    lang.icons?.length > 0
      ? lang.icons
      : [
          {
            id: "fb",
            kind: "flag" as const,
            region: allowedRegions[0] || lang.primaryRegion || "FR",
          },
        ];

  const onActiveIdChange = useCallback((id: string | null) => {
    setActiveOutlineId(id);
  }, []);

  /** Permanent country chips — flag + ISO code, bottom of card */
  const countryLabels = outlines.map((o) => {
    const code = o.code?.toUpperCase() || null;
    return {
      id: o.id,
      code,
      flag: code ? regionFlag(code) : undefined,
      // Prefer ISO code for compact bottom labels
      text: code || l(o.label) || "—",
    };
  });

  return (
    <motion.div
      variants={cardItemVariants}
      onViewportEnter={() => setInView(true)}
      onMouseEnter={startDemo}
      onMouseLeave={stopDemo}
      onTouchStart={startDemo}
      onTouchEnd={stopDemo}
      className="h-full"
    >
      {/* Hover lift + glow entirely driven by Framer Motion (no CSS glass-glow) */}
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                y: hover ? -7 : 0,
                boxShadow: hover
                  ? "0 28px 56px -18px rgba(0,0,0,0.72), 0 0 48px -8px rgba(245,158,11,0.22)"
                  : "0 16px 40px -20px rgba(0,0,0,0.45)",
                borderColor: hover
                  ? "rgba(255,255,255,0.24)"
                  : "rgba(255,255,255,0.14)",
                scale: hover ? 1.012 : 1,
              }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 280,
                damping: 28,
                mass: 0.7,
              }
        }
        className="h-full will-change-transform"
      >
        <GlassCard
          className={cn(
            "group relative isolate flex h-full min-h-[300px] flex-col overflow-hidden p-0 !transition-none",
            hasVideo && "cursor-default"
          )}
        >
          <LanguageRegionsMap
            outlines={outlines}
            active={inView && !hover}
            className="z-0"
            onActiveIdChange={onActiveIdChange}
          />

          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/70 via-black/25 to-black/35" />

          {/* Demo video with sound — mounted for uploads so hover can playUnmuted() */}
          {hasVideo && (
            <div
              className={cn(
                "absolute inset-0 z-[5] transition-opacity duration-300",
                videoPlaying ? "opacity-100" : "pointer-events-none opacity-0"
              )}
            >
              <LanguageHoverVideo
                ref={demoVideoRef}
                videoType={lang.videoType}
                videoUrl={lang.videoUrl}
                languageName={l(lang.name)}
                active={videoPlaying}
              />
              {videoPlaying && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              )}
            </div>
          )}

          <div className="relative z-20 flex min-h-0 flex-1 flex-col p-5">
            <div className="flex w-full shrink-0 items-start justify-between gap-2">
              <LanguageIconCarousel
                icons={icons}
                allowedRegions={allowedRegions}
                languageName={l(lang.name)}
              />
              <div className="relative z-30 flex shrink-0 items-center gap-1">
                {/* Idle only — hide while the demo video is playing */}
                {hasVideo && !videoPlaying && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-medium text-zinc-200 backdrop-blur-md"
                  >
                    <Volume2 className="h-3 w-3 text-amber-300/90" />
                    {t("languages.demoHint")}
                  </motion.span>
                )}
                {editMode && (
                  <div className="flex gap-0.5 rounded-xl border border-white/10 bg-black/50 p-0.5 backdrop-blur-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-20 mt-5 flex min-h-0 flex-1 flex-col">
              <motion.h3
                layout
                className="text-lg font-semibold tracking-tight text-zinc-50 drop-shadow-md"
              >
                {l(lang.name)}
              </motion.h3>
              <Badge variant="amber" className="mt-2 w-fit shrink-0">
                {l(lang.level)}
              </Badge>

              {/* Bottom area: zones (idle) OR proof title (while demo plays) */}
              <div className="mt-auto flex flex-col items-center pt-6">
                <AnimatePresence mode="wait">
                  {videoPlaying ? (
                    <motion.div
                      key="proof"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="flex w-full items-center justify-center px-3"
                    >
                      {/* Same Badge as level labels (e.g. « Natif ») */}
                      <Badge variant="amber">{t("languages.proofTitle")}</Badge>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="zones"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="flex w-full flex-col items-center"
                    >
                      {countryLabels.length > 0 ? (
                        <div className="flex w-full flex-wrap items-center justify-center gap-2">
                          {countryLabels.map((c) => {
                            const isActive =
                              c.id === activeOutlineId && !hover;
                            return (
                              <motion.span
                                key={c.id}
                                layout
                                initial={false}
                                animate={{
                                  scale: isActive ? 1.08 : 1,
                                  borderColor: isActive
                                    ? "rgba(251, 191, 36, 0.6)"
                                    : "rgba(255, 255, 255, 0.15)",
                                  backgroundColor: isActive
                                    ? "rgba(251, 191, 36, 0.3)"
                                    : "rgba(0, 0, 0, 0.45)",
                                  color: isActive
                                    ? "rgba(255, 251, 235, 1)"
                                    : "rgba(228, 228, 231, 1)",
                                  boxShadow: isActive
                                    ? "0 0 22px rgba(245,158,11,0.48), 0 0 0 1px rgba(251,191,36,0.25)"
                                    : "0 0 0 0 transparent",
                                }}
                                transition={
                                  reduceMotion
                                    ? { duration: 0.15 }
                                    : {
                                        type: "spring",
                                        stiffness: 280,
                                        damping: 24,
                                        mass: 0.5,
                                      }
                                }
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-md"
                                title={
                                  c.code
                                    ? REGION_LABELS[c.code] || c.code
                                    : c.text
                                }
                              >
                                {c.flag && (
                                  <motion.span
                                    animate={{
                                      scale: isActive ? 1.14 : 1,
                                      rotate: isActive
                                        ? [0, -4, 4, 0]
                                        : 0,
                                    }}
                                    transition={{
                                      duration: 0.45,
                                      ease: EASE,
                                    }}
                                    className="text-[13px] leading-none"
                                  >
                                    {c.flag}
                                  </motion.span>
                                )}
                                <span className="uppercase">{c.text}</span>
                              </motion.span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-xs text-zinc-500">
                          Aucun pays configuré
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
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
    if (!getL(name).trim() || !getL(level).trim()) {
      setError("Nom et niveau sont obligatoires.");
      return;
    }

    let finalType: LanguageVideoType = videoType;
    let finalUrl: string | null = null;

    if (videoType === "file") {
      if (!videoUrl) {
        setError("Uploadez une vidéo ou choisissez « Aucune ».");
        return;
      }
      finalUrl = videoUrl;
    } else if (videoType === "youtube") {
      const url = linkInput.trim();
      if (!url || !isYoutubeUrl(url)) {
        setError("Collez un lien YouTube valide.");
        return;
      }
      finalUrl = url;
    } else if (videoType === "x") {
      const url = linkInput.trim();
      if (!url || !isXUrl(url)) {
        setError("Collez un lien X (post) valide.");
        return;
      }
      finalUrl = url;
    } else {
      finalType = "none";
      finalUrl = null;
    }

    if (outlines.length === 0) {
      setError("Ajoutez au moins un contour de pays (ou SVG).");
      return;
    }

    const regionCodes = normalizeRegionCodes(
      outlines.map((o) => o.code).filter((c): c is string => Boolean(c))
    );

    // Only keep icons that match associated countries
    let finalIcons = filterIconsToRegions(icons, regionCodes);
    if (finalIcons.length === 0 && regionCodes.length > 0) {
      finalIcons = defaultIconsForRegions(regionCodes, createId());
    }
    if (finalIcons.length === 0) {
      setError("Ajoutez au moins une icône liée aux pays de la langue.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const srcLocale = editingLocale;

      // Always expand name + level to FR / EN / PL / ES
      // (dictionary first, then free API for custom levels)
      const [localizedName, localizedLevel, ...localizedOutlineLabels] =
        await Promise.all([
          fillMissingLocales(name, srcLocale),
          fillMissingLocales(level, srcLocale),
          ...outlines.map(async (o) => {
            if (o.code) return localizedRegionLabel(o.code);
            const labelText =
              getL(o.label, srcLocale) || getL(o.label) || "Région";
            return fillMissingLocales(
              o.label ?? { [srcLocale]: labelText },
              srcLocale
            );
          }),
        ]);

      const localizedOutlines = outlines.map((o, i) => ({
        ...o,
        code: o.code?.toUpperCase(),
        label: localizedOutlineLabels[i],
      }));

      const payload = {
        name: localizedName,
        level: localizedLevel,
        videoType: finalType,
        videoUrl: finalUrl,
        icons: finalIcons,
        outlines: localizedOutlines,
        primaryRegion: regionCodes[0] || "FR",
        regions: regionCodes,
      };

      if (editing) updateLanguage(editing.id, payload);
      else addLanguage(payload);
      setOpen(false);
      resetForm();
    } catch {
      setError("Traduction automatique impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
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
          className="grid gap-4 sm:grid-cols-3"
          variants={cardGridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {data.languages.map((lang) => (
            <LanguageCard
              key={lang.id}
              lang={lang}
              editMode={editMode}
              onEdit={() => openEdit(lang)}
              onDelete={() => {
                if (confirm("Supprimer cette langue ?")) {
                  removeLanguage(lang.id);
                }
              }}
            />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la langue" : "Ajouter une langue"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div onBlur={handleNameBlur}>
              <LocalizedField
                label="Langue"
                value={name}
                onChange={setName}
                placeholder="Français"
              />
            </div>
            <LocalizedField
              label="Niveau"
              value={level}
              onChange={setLevel}
              placeholder="Natif, Courant…"
            />

            {/* —— Icons multi —— */}
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                    Icônes
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Plusieurs icônes → fondu toutes les 2 s
                  </p>
                </div>
              </div>

              {allowedRegionCodes.length === 0 ? (
                <p className="text-xs text-amber-200/80">
                  Ajoutez d’abord des pays dans « Contours » — les icônes sont
                  limitées à ces pays uniquement.
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500">
                  Pays autorisés :{" "}
                  {allowedRegionCodes
                    .map((c) => `${regionFlag(c)} ${c}`)
                    .join(" · ")}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {ICON_KINDS.map(({ kind, label, icon: Icon }) => (
                  <Button
                    key={kind}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 text-[10px]"
                    disabled={
                      kind !== "upload" && allowedRegionCodes.length === 0
                    }
                    onClick={() => addIcon(kind)}
                  >
                    <Icon className="h-3 w-3" />
                    + {label}
                  </Button>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={allowedRegionCodes.length === 0}
                onClick={() =>
                  setIcons(
                    defaultIconsForRegions(allowedRegionCodes, createId())
                  )
                }
              >
                Remplir auto (tous les pays de la langue)
              </Button>

              {icons.map((icon, index) => {
                const regionOptions =
                  allowedRegionCodes.length > 0
                    ? allowedRegionCodes
                    : REGION_CODES;
                const region = (icon.region || regionOptions[0] || "FR").toUpperCase();
                const monOptions = countryMonuments(region);
                const culOptions = countryCulture(region);

                return (
                  <div
                    key={icon.id}
                    className="grid gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase text-teal-300">
                        Icône {index + 1} · {icon.kind}
                        {icon.region ? ` · ${icon.region}` : ""}
                      </span>
                      <div className="flex gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => moveIcon(index, -1)}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === icons.length - 1}
                          onClick={() => moveIcon(index, 1)}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400"
                          onClick={() =>
                            setIcons((list) =>
                              list.filter((i) => i.id !== icon.id)
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {(icon.kind === "flag" ||
                      icon.kind === "outline" ||
                      icon.kind === "monument" ||
                      icon.kind === "culture") && (
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-zinc-400">
                          Pays (uniquement ceux de la langue)
                        </Label>
                        <select
                          value={
                            regionOptions.includes(region)
                              ? region
                              : regionOptions[0]
                          }
                          onChange={(e) =>
                            updateIcon(icon.id, { region: e.target.value })
                          }
                          className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm text-zinc-100"
                        >
                          {regionOptions.map((code) => (
                            <option key={code} value={code}>
                              {regionFlag(code)} {REGION_LABELS[code] || code} (
                              {code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {icon.kind === "monument" && (
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-zinc-400">
                          Symboles de {REGION_LABELS[region] || region} uniquement
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {monOptions.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() =>
                                updateIcon(icon.id, { emoji: e })
                              }
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border text-base",
                                icon.emoji === e
                                  ? "border-teal-300/40 bg-teal-300/15"
                                  : "border-white/10 bg-white/5"
                              )}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {icon.kind === "culture" && (
                      <div className="grid gap-1.5">
                        <Label className="text-xs text-zinc-400">
                          Culture de {REGION_LABELS[region] || region} uniquement
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {culOptions.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() =>
                                updateIcon(icon.id, { emoji: e })
                              }
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border text-base",
                                icon.emoji === e
                                  ? "border-teal-300/40 bg-teal-300/15"
                                  : "border-white/10 bg-white/5"
                              )}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {icon.kind === "upload" && (
                      <ImageUpload
                        value={icon.src ?? null}
                        onChange={(src) => updateIcon(icon.id, { src })}
                        aspectClassName="aspect-square max-h-24 max-w-24"
                        label="PNG, SVG, WebP…"
                        folder="patrick-roziel/languages"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* —— Countries / outlines —— */}
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                    Pays autorisés
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Cliquez pour ajouter / retirer. Les icônes et contours
                    utilisent ces pays.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px]"
                  onClick={applySuggestedRegions}
                >
                  Suggestions pour « {getL(name) || "…"} »
                </Button>
              </div>

              {suggestedRegions.length > 0 && (
                <div className="grid gap-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                    Suggérés pour cette langue
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedRegions.map((code) => {
                      const selected = allowedRegionCodes.includes(code);
                      return (
                        <button
                          key={`sug-${code}`}
                          type="button"
                          onClick={() => toggleRegionCode(code)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                            selected
                              ? "border-teal-300/50 bg-teal-300/20 text-teal-100"
                              : "border-white/12 bg-black/25 text-zinc-400 hover:border-teal-300/30 hover:text-teal-200"
                          )}
                        >
                          {regionFlag(code)} {REGION_LABELS[code] || code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  Tous les pays
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {REGION_CODES.map((code) => {
                    const selected = allowedRegionCodes.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleRegionCode(code)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                          selected
                            ? "border-teal-300/50 bg-teal-300/20 text-teal-100"
                            : "border-white/12 bg-black/25 text-zinc-400 hover:border-teal-300/30 hover:text-teal-200"
                        )}
                      >
                        {regionFlag(code)} {REGION_LABELS[code] || code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {allowedRegionCodes.length > 0 && (
                <p className="text-[10px] text-zinc-500">
                  Sélection :{" "}
                  {allowedRegionCodes
                    .map((c) => `${regionFlag(c)} ${REGION_LABELS[c] || c}`)
                    .join(" · ")}
                </p>
              )}

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setOutlines((list) => [
                    ...list,
                    {
                      id: createId(),
                      // Keep a country code so it stays in “pays autorisés”
                      code: allowedRegionCodes[0] || "FR",
                      label: "SVG perso",
                      customSvg: null,
                    },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Contour SVG personnalisé
              </Button>

              {outlines.map((ol, index) => (
                <div
                  key={ol.id}
                  className="grid gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase text-teal-300">
                      Contour {index + 1}
                      {ol.code ? ` · ${ol.code}` : " · SVG"}
                    </span>
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => {
                          setOutlines((list) => {
                            const next = [...list];
                            const j = index - 1;
                            if (j < 0) return list;
                            [next[index], next[j]] = [next[j], next[index]];
                            return next;
                          });
                        }}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={index === outlines.length - 1}
                        onClick={() => {
                          setOutlines((list) => {
                            const next = [...list];
                            const j = index + 1;
                            if (j >= next.length) return list;
                            [next[index], next[j]] = [next[j], next[index]];
                            return next;
                          });
                        }}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400"
                        onClick={() =>
                          setOutlines((list) =>
                            list.filter((o) => o.id !== ol.id)
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <LocalizedField
                    label="Libellé"
                    value={ol.label}
                    onChange={(v) => updateOutline(ol.id, { label: v })}
                    placeholder="France"
                  />

                  {!ol.customSvg && (
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-zinc-400">
                        Pays intégré
                      </Label>
                      <select
                        value={(ol.code || "FR").toUpperCase()}
                        onChange={(e) => {
                          const code = e.target.value.toUpperCase();
                          updateOutline(ol.id, {
                            code,
                            label: localizedRegionLabel(code),
                          });
                        }}
                        className="h-9 w-full rounded-lg border border-white/15 bg-black/30 px-2 text-sm text-zinc-100"
                      >
                        {REGION_CODES.map((code) => (
                          <option key={code} value={code}>
                            {regionFlag(code)} {REGION_LABELS[code]} ({code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid gap-1.5">
                    <Label className="text-xs text-zinc-400">
                      Couleur du trait (orange par défaut)
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={ol.color || DEFAULT_OUTLINE_COLOR}
                        onChange={(e) =>
                          updateOutline(ol.id, { color: e.target.value })
                        }
                        className="h-9 w-12 cursor-pointer rounded border border-white/15 bg-transparent"
                      />
                      <Input
                        value={ol.color || DEFAULT_OUTLINE_COLOR}
                        onChange={(e) =>
                          updateOutline(ol.id, { color: e.target.value })
                        }
                        className="font-mono text-xs"
                        placeholder="#f59e0b"
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs text-zinc-400">
                      Ou SVG personnalisé
                    </Label>
                    <SvgUpload
                      value={ol.customSvg ?? null}
                      onChange={(svg) =>
                        updateOutline(ol.id, {
                          customSvg: svg,
                          // Keep country code so the region stays “autorisée”
                          code: ol.code || allowedRegionCodes[0] || "FR",
                        })
                      }
                      label="Contour SVG (path fermé recommandé)"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* —— Video —— */}
            <div className="grid gap-2">
              <Label>Vidéo de démo (survol uniquement)</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VIDEO_OPTIONS.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setVideoType(type);
                      setError(null);
                      if (type === "none") {
                        setVideoUrl(null);
                        setLinkInput("");
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] font-medium",
                      videoType === type
                        ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                        : "border-white/10 bg-white/5 text-zinc-400"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {videoType === "file" && (
              <VideoUpload
                value={videoUrl}
                onChange={setVideoUrl}
                folder="patrick-roziel/languages"
              />
            )}
            {videoType === "youtube" && (
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://youtu.be/…"
              />
            )}
            {videoType === "x" && (
              <Input
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://x.com/…/status/…"
              />
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Traduction…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

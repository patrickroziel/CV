"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  FileDown,
  Mail,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ExtraDocumentButtons } from "@/components/shared/ExtraDocumentButtons";
import { GlassCard } from "@/components/glass/GlassCard";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ShowreelEmbed } from "@/components/shared/ShowreelEmbed";
import { HeroPhotoWaves } from "@/components/sections/hero/HeroPhotoWaves";
import { ProfilePhotoAura } from "@/components/sections/hero/ProfilePhotoAura";
import { createId, printCv } from "@/lib/utils";
import type { HeroBadge, Profile } from "@/lib/types";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { RichTextField } from "@/components/i18n/RichTextField";
import { RichHtml } from "@/components/shared/RichHtml";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import { defaultHeroBadgesFromProfile } from "@/lib/storage";
import { DEFAULT_EXPERIENCE_BADGE } from "@/lib/types";

export function HeroSection() {
  const {
    data,
    updateProfile,
    updateContact,
    isHydrated,
    editMode,
    l,
  } = usePortfolio();
  const { profile, contact: c } = data;
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);
  const [heroShowreelLabel, setHeroShowreelLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroShowreelLabel)
  );
  const [heroCvLabel, setHeroCvLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroCvLabel)
  );
  const [showHeroShowreel, setShowHeroShowreel] = useState(c.showHeroShowreel);
  const [showHeroCv, setShowHeroCv] = useState(c.showHeroCv);
  const [showHeroEmail, setShowHeroEmail] = useState(c.showHeroEmail);
  const [heroEmailLabel, setHeroEmailLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroEmailLabel)
  );

  const plainName = stripHtml(profile.name) || profile.name;
  const emailLabelText = l(c.heroEmailLabel);
  const heroBadges: HeroBadge[] =
    profile.heroBadges && profile.heroBadges.length > 0
      ? profile.heroBadges
      : defaultHeroBadgesFromProfile(profile);

  const openEdit = () => {
    setDraft({
      ...profile,
      experienceBadge: liftToLocalized(
        profile.experienceBadge ?? DEFAULT_EXPERIENCE_BADGE
      ),
      heroBadges:
        profile.heroBadges && profile.heroBadges.length > 0
          ? profile.heroBadges.map((b) => ({
              ...b,
              text: liftToLocalized(b.text),
            }))
          : defaultHeroBadgesFromProfile(profile),
      heroFontFamily: "",
    });
    setHeroShowreelLabel(liftToLocalized(c.heroShowreelLabel));
    setHeroCvLabel(liftToLocalized(c.heroCvLabel));
    setShowHeroShowreel(c.showHeroShowreel);
    setShowHeroCv(c.showHeroCv);
    setShowHeroEmail(c.showHeroEmail);
    setHeroEmailLabel(liftToLocalized(c.heroEmailLabel));
    setEditOpen(true);
  };

  const saveProfile = () => {
    const namePlain = stripHtml(draft.name || "").trim() || draft.name;

    updateProfile({
      ...draft,
      name: draft.name?.trim() ? draft.name : namePlain,
      phone: "",
      experienceBadge: draft.experienceBadge ?? DEFAULT_EXPERIENCE_BADGE,
      heroBadges: (draft.heroBadges ?? []).map((b) => ({
        ...b,
        text: liftToLocalized(b.text),
      })),
      heroFontFamily: "",
      age: draft.age ? Number(draft.age) : undefined,
    });

    updateContact({
      heroShowreelLabel: getL(heroShowreelLabel).trim()
        ? heroShowreelLabel
        : "Voir le showreel",
      heroCvLabel: getL(heroCvLabel).trim() ? heroCvLabel : "Télécharger CV",
      showHeroShowreel,
      showHeroCv,
      showHeroPhone: false,
      showHeroEmail,
      heroPhoneLabel: "",
      heroEmailLabel,
      showPhone: false,
      phoneLabel: "",
      phoneValue: "",
      quickContactLinks: (c.quickContactLinks ?? []).filter(
        (link) =>
          link.icon !== "phone" &&
          !String(link.href || "").trim().toLowerCase().startsWith("tel:")
      ),
    });
    setEditOpen(false);
  };

  const handleDownloadCv = () => {
    if (profile.cvUrl) {
      const a = document.createElement("a");
      a.href = profile.cvUrl;
      a.download = `CV-${plainName.replace(/\s+/g, "-")}.pdf`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      return;
    }
    printCv();
  };

  const scrollToShowreel = () => {
    document
      .getElementById("showreel")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!isHydrated) {
    return (
      <section id="hero" className="relative min-h-[70vh] pb-16 pt-28">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
          <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
          <div className="aspect-video animate-pulse rounded-3xl bg-white/5" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative z-10 overflow-hidden pb-12 pt-24 sm:pb-16 sm:pt-28"
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 sm:space-y-8">
        {/*
          Shell height = GlassCard content only.
          Media layers are absolute and never set min/max height.
        */}
        <div className="relative isolate mx-auto max-w-3xl">
          <GlassCard
            className="work-hero-card relative z-[1] isolate overflow-hidden p-6 sm:p-8 lg:p-9"
          >

            {/*
              Référence : photo gauche + infos droite
              Mobile : photo puis textes
            */}
            <div className="relative z-10">
              {/* —— Photo (gauche) —— */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="hidden"
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 sm:h-[20rem] sm:w-[20rem]"
                    aria-hidden
                  >
                    <HeroPhotoWaves mode="photo" />
                  </div>
                  <ProfilePhotoAura
                    photo={profile.photo}
                    name={plainName}
                    className="relative z-10 !mx-0 h-36 w-36 sm:h-44 sm:w-44 lg:h-48 lg:w-48"
                  >
                    <EditGate>
                      <button
                        type="button"
                        onClick={() => setPhotoOpen(true)}
                        className="absolute bottom-1 right-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-200 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white"
                        aria-label="Changer la photo"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </EditGate>
                  </ProfilePhotoAura>
                </div>
              </motion.div>

              {/* —— Infos (droite) —— */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative z-10 flex min-w-0 flex-col items-start gap-3 text-left sm:gap-3.5"
              >
                {editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEdit}
                    className="h-7 gap-1 self-start px-2 text-xs text-zinc-400"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier le profil
                  </Button>
                )}

                {/* Badges (éditables) */}
                {heroBadges.length > 0 && (
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    {heroBadges.map((badge) => {
                      const text = l(badge.text);
                      if (!text) return null;
                      return (
                        <span
                          key={badge.id}
                          className="inline-flex max-w-full items-center rounded-full border border-white/15 px-3 py-1 text-xs font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-md"
                          style={{
                            backgroundColor: badge.bgColor,
                            color: badge.textColor,
                          }}
                        >
                          <RichHtml
                            as="span"
                            html={text}
                            className="inline"
                          />
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Nom */}
                <RichHtml
                  as="h1"
                  html={profile.name}
                  className="text-3xl font-semibold tracking-[-0.025em] text-zinc-50 sm:text-4xl"
                />

                {/* Titre */}
                <RichHtml
                  html={l(profile.title)}
                  className="text-base font-medium text-teal-200 sm:text-lg"
                />

                <div aria-hidden className="h-px w-16 bg-gradient-to-r from-teal-300/70 to-transparent" />

                {/* Bio */}
                {l(profile.bio) && (
                  <div className="w-full max-w-2xl">
                    <div className="max-w-2xl">
                      <RichHtml
                        html={l(profile.bio)}
                        className="text-[0.95rem] leading-7 text-zinc-300 sm:text-base"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                {c.showHeroEmail && (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-zinc-200 lg:justify-start">
                    {c.showHeroEmail && (
                      <a
                        href={`mailto:${profile.email}`}
                        className="inline-flex items-center gap-1.5 transition hover:text-teal-300"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <RichHtml
                          as="span"
                          html={emailLabelText || profile.email}
                          className="inline"
                        />
                      </a>
                    )}
                  </div>
                )}

                {/* Boutons sur une ligne */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5 lg:justify-start">
                  {c.showHeroShowreel && profile.showreelUrl && (
                    <MagneticButton>
                      <Button size="default" onClick={scrollToShowreel}>
                        <Play className="h-4 w-4" />
                        <RichHtml
                          as="span"
                          html={l(c.heroShowreelLabel)}
                          className="inline"
                        />
                      </Button>
                    </MagneticButton>
                  )}
                  {c.showHeroCv && (
                    <MagneticButton>
                      <Button
                        size="default"
                        variant="secondary"
                        onClick={handleDownloadCv}
                      >
                        <FileDown className="h-4 w-4" />
                        <RichHtml
                          as="span"
                          html={l(c.heroCvLabel)}
                          className="inline"
                        />
                      </Button>
                    </MagneticButton>
                  )}
                  <ExtraDocumentButtons placement="hero" size="default" />
                </div>
              </motion.div>
            </div>
          </GlassCard>
        </div>

        <ShowreelEmbed />
      </div>

      {/* —— Edit dialog —— */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          size="form"
          className="flex max-h-[min(92dvh,900px)] flex-col gap-0 overflow-hidden p-0"
        >
          <div className="shrink-0 border-b border-white/10 px-6 pb-3 pt-6 pr-12">
            <DialogHeader>
              <DialogTitle>Modifier le profil (Hero)</DialogTitle>
              <p className="text-xs text-zinc-500">
                Textes avec mise en forme : gras, italique, taille, couleur,
                alignement (pas de HTML brut).
              </p>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            <div className="grid gap-4">
              <RichTextField
                label="Nom"
                value={draft.name}
                onChange={(name) =>
                  setDraft((prev) => ({ ...prev, name }))
                }
                compact
                placeholder="Patrick Roziel"
                id="name"
              />

              <RichLocalizedField
                label="Titre"
                value={draft.title}
                onChange={(title) =>
                  setDraft((prev) => ({ ...prev, title }))
                }
                compact
                rows={2}
                id="title"
              />

              <RichLocalizedField
                label="Bio"
                value={draft.bio}
                onChange={(bio) => setDraft((prev) => ({ ...prev, bio }))}
                rows={8}
                id="bio"
              />

              {/* Badges editor */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Badges (haut du Hero)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 gap-1 text-xs"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        heroBadges: [
                          ...(prev.heroBadges ?? []),
                          {
                            id: createId(),
                            text: liftToLocalized("Nouveau badge"),
                            bgColor: "#134e4a",
                            textColor: "#99f6e4",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(draft.heroBadges ?? []).map((badge, index) => (
                    <li
                      key={badge.id}
                      className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-2"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <RichLocalizedField
                            label={`Badge ${index + 1}`}
                            value={badge.text}
                            onChange={(text) =>
                              setDraft((prev) => ({
                                ...prev,
                                heroBadges: (prev.heroBadges ?? []).map((b) =>
                                  b.id === badge.id ? { ...b, text } : b
                                ),
                              }))
                            }
                            compact
                            rows={1}
                            hint=""
                            id={`badge-text-${badge.id}`}
                          />
                        </div>
                        <div className="flex shrink-0 flex-col gap-0.5 pt-6">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() =>
                              setDraft((prev) => {
                                const list = [...(prev.heroBadges ?? [])];
                                if (index <= 0) return prev;
                                [list[index - 1], list[index]] = [
                                  list[index],
                                  list[index - 1],
                                ];
                                return { ...prev, heroBadges: list };
                              })
                            }
                            aria-label="Monter"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={
                              index >= (draft.heroBadges?.length ?? 0) - 1
                            }
                            onClick={() =>
                              setDraft((prev) => {
                                const list = [...(prev.heroBadges ?? [])];
                                if (index >= list.length - 1) return prev;
                                [list[index], list[index + 1]] = [
                                  list[index + 1],
                                  list[index],
                                ];
                                return { ...prev, heroBadges: list };
                              })
                            }
                            aria-label="Descendre"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                heroBadges: (prev.heroBadges ?? []).filter(
                                  (b) => b.id !== badge.id
                                ),
                              }))
                            }
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          Fond
                          <input
                            type="color"
                            value={
                              badge.bgColor.startsWith("#")
                                ? badge.bgColor.slice(0, 7)
                                : "#27272a"
                            }
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                heroBadges: (prev.heroBadges ?? []).map((b) =>
                                  b.id === badge.id
                                    ? { ...b, bgColor: e.target.value }
                                    : b
                                ),
                              }))
                            }
                            className="h-7 w-9 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          Texte
                          <input
                            type="color"
                            value={
                              badge.textColor.startsWith("#")
                                ? badge.textColor.slice(0, 7)
                                : "#f4f4f5"
                            }
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                heroBadges: (prev.heroBadges ?? []).map((b) =>
                                  b.id === badge.id
                                    ? { ...b, textColor: e.target.value }
                                    : b
                                ),
                              }))
                            }
                            className="h-7 w-9 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                          />
                        </label>
                        <span
                          className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px]"
                          style={{
                            backgroundColor: badge.bgColor,
                            color: badge.textColor,
                          }}
                        >
                          Aperçu
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {(draft.heroBadges ?? []).length === 0 && (
                  <p className="text-[10px] text-zinc-500">
                    Aucun badge. Cliquez sur « Ajouter ».
                  </p>
                )}
              </div>

              <RichLocalizedField
                label="Localisation (profil / CV)"
                value={draft.location}
                onChange={(location) =>
                  setDraft((prev) => ({ ...prev, location }))
                }
                compact
                rows={1}
                id="location"
                hint="Champ profil (Contact, CV). Les badges Hero se gèrent ci-dessus."
              />

              <div className="grid gap-2">
                <Label htmlFor="email">Email (lien mailto:)</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="showreel">URL Showreel</Label>
                <Input
                  id="showreel"
                  value={draft.showreelUrl}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      showreelUrl: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvUrl">Lien CV externe (optionnel)</Label>
                <Input
                  id="cvUrl"
                  placeholder="Sinon : Exporter PDF"
                  value={draft.cvUrl ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      cvUrl: e.target.value || null,
                    }))
                  }
                />
              </div>

              <div className="h-px bg-white/10" />
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Labels & boutons (Hero)
              </p>

              <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                <span>Afficher Showreel</span>
                <input
                  type="checkbox"
                  checked={showHeroShowreel}
                  onChange={(e) => setShowHeroShowreel(e.target.checked)}
                  className="accent-teal-300"
                />
              </label>
              {showHeroShowreel && (
                <RichLocalizedField
                  label="Label bouton Showreel"
                  value={heroShowreelLabel}
                  onChange={setHeroShowreelLabel}
                  compact
                  rows={1}
                  placeholder="Voir le showreel"
                  id="hero-showreel-label"
                  hint=""
                />
              )}

              <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                <span>Afficher CV</span>
                <input
                  type="checkbox"
                  checked={showHeroCv}
                  onChange={(e) => setShowHeroCv(e.target.checked)}
                  className="accent-teal-300"
                />
              </label>
              {showHeroCv && (
                <RichLocalizedField
                  label="Label bouton CV"
                  value={heroCvLabel}
                  onChange={setHeroCvLabel}
                  compact
                  rows={1}
                  placeholder="Télécharger CV"
                  id="hero-cv-label"
                  hint=""
                />
              )}

              <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
                <span>Afficher email</span>
                <input
                  type="checkbox"
                  checked={showHeroEmail}
                  onChange={(e) => setShowHeroEmail(e.target.checked)}
                  className="accent-teal-300"
                />
              </label>
              {showHeroEmail && (
                <RichLocalizedField
                  label="Label email (optionnel)"
                  value={heroEmailLabel}
                  onChange={setHeroEmailLabel}
                  compact
                  rows={1}
                  placeholder="Vide = adresse seule"
                  id="hero-email-label"
                  hint=""
                />
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-black/20 px-6 py-3">
            <DialogFooter className="sm:justify-end">
              <Button variant="secondary" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button onClick={saveProfile}>Enregistrer</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Photo de profil</DialogTitle>
          </DialogHeader>
          <ImageUpload
            value={profile.photo}
            onChange={(photo) => updateProfile({ photo })}
            aspectClassName="aspect-square max-w-[240px] mx-auto w-full"
            round
            label="Glissez ou cliquez pour uploader"
            folder="patrick-roziel/profile"
          />
          <DialogFooter>
            <Button onClick={() => setPhotoOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  FileDown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Play,
} from "lucide-react";
// X logo as simple SVG component (lucide has no brand X)
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { GlassCard } from "@/components/glass/GlassCard";
import { Badge } from "@/components/ui/badge";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { ShowreelEmbed } from "@/components/shared/ShowreelEmbed";
import { HeroAmbientBackground } from "@/components/sections/hero/HeroAmbientBackground";
import { HeroPhotoWaves } from "@/components/sections/hero/HeroPhotoWaves";
import { ProfilePhotoAura } from "@/components/sections/hero/ProfilePhotoAura";
import { printCv, xProfileHref } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { t as translateUi } from "@/i18n";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.913L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export function HeroSection() {
  const {
    data,
    updateProfile,
    updateContact,
    isHydrated,
    editMode,
    l,
    t,
    locale,
  } = usePortfolio();
  const { profile, contact: c } = data;
  /** UI strings — prefer provider `t`, fallback to direct i18n catalog */
  const tr = (key: string) =>
    typeof t === "function" ? t(key) : translateUi(key, locale);
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
  const [showHeroPhone, setShowHeroPhone] = useState(c.showHeroPhone);
  const [showHeroEmail, setShowHeroEmail] = useState(c.showHeroEmail);
  const [heroPhoneLabel, setHeroPhoneLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroPhoneLabel)
  );
  const [heroEmailLabel, setHeroEmailLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroEmailLabel)
  );
  const [showHeroX, setShowHeroX] = useState(c.showHeroX ?? true);
  const [heroXLabel, setHeroXLabel] = useState<LocalizedString>(
    liftToLocalized(c.heroXLabel || "X / Twitter")
  );
  const [xProfileUrl, setXProfileUrl] = useState(c.xProfileUrl || "");

  const openEdit = () => {
    setDraft(profile);
    setHeroShowreelLabel(liftToLocalized(c.heroShowreelLabel));
    setHeroCvLabel(liftToLocalized(c.heroCvLabel));
    setShowHeroShowreel(c.showHeroShowreel);
    setShowHeroCv(c.showHeroCv);
    setShowHeroPhone(c.showHeroPhone);
    setShowHeroEmail(c.showHeroEmail);
    setHeroPhoneLabel(liftToLocalized(c.heroPhoneLabel));
    setHeroEmailLabel(liftToLocalized(c.heroEmailLabel));
    setShowHeroX(c.showHeroX ?? true);
    setHeroXLabel(liftToLocalized(c.heroXLabel || "X / Twitter"));
    setXProfileUrl(c.xProfileUrl || "");
    setEditOpen(true);
  };

  const saveProfile = () => {
    updateProfile({
      ...draft,
      age: draft.age ? Number(draft.age) : undefined,
    });
    updateContact({
      heroShowreelLabel: getL(heroShowreelLabel).trim()
        ? heroShowreelLabel
        : "Voir le showreel",
      heroCvLabel: getL(heroCvLabel).trim()
        ? heroCvLabel
        : "Télécharger CV",
      showHeroShowreel,
      showHeroCv,
      showHeroPhone,
      showHeroEmail,
      heroPhoneLabel,
      heroEmailLabel,
      showHeroX,
      heroXLabel: getL(heroXLabel).trim() ? heroXLabel : "X / Twitter",
      xProfileUrl: xProfileUrl.trim(),
    });
    setEditOpen(false);
  };

  const handleDownloadCv = () => {
    if (profile.cvUrl) {
      const a = document.createElement("a");
      a.href = profile.cvUrl;
      a.download = `CV-${profile.name.replace(/\s+/g, "-")}.pdf`;
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
      className="relative z-10 overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36"
    >
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 sm:space-y-8">
        <GlassCard
          elevated
          className="relative isolate overflow-hidden p-6 sm:p-10"
        >
          {/* Full-card cinematic energy (from photo zone → whole surface) */}
          <HeroPhotoWaves />
          {/* Scrims above waves so type stays readable */}
          <HeroAmbientBackground />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mx-auto"
            >
              <ProfilePhotoAura photo={profile.photo} name={profile.name}>
                <EditGate>
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="absolute bottom-1 right-1 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-zinc-200 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:text-white"
                    aria-label="Changer la photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </EditGate>
              </ProfilePhotoAura>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative z-10 text-center drop-shadow-[0_2px_16px_rgba(0,0,0,0.75)] lg:text-left"
            >
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {l(profile.location) && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                    <MapPin className="h-3 w-3" />
                    {l(profile.location)}
                  </Badge>
                )}
                <Badge variant="amber">{tr("hero.experienceBadge")}</Badge>
                {editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEdit}
                    className="h-7 gap-1 text-xs text-zinc-500"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </Button>
                )}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-zinc-50 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] sm:text-5xl">
                {profile.name}
              </h1>
              <p className="mt-3 text-base font-medium text-teal-200 drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] sm:text-lg">
                {l(profile.title)}
              </p>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-100 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] lg:mx-0">
                {l(profile.bio)}
              </p>

              {(c.showHeroPhone || c.showHeroEmail) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] lg:justify-start">
                  {c.showHeroPhone && (
                    <a
                      href={`tel:${profile.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 transition hover:text-teal-300"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {l(c.heroPhoneLabel) || profile.phone}
                    </a>
                  )}
                  {c.showHeroEmail && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center gap-1.5 transition hover:text-teal-300"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {l(c.heroEmailLabel) || profile.email}
                    </a>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {c.showHeroShowreel && profile.showreelUrl && (
                  <MagneticButton>
                    <Button size="lg" onClick={scrollToShowreel}>
                      <Play className="h-4 w-4" />
                      {l(c.heroShowreelLabel)}
                    </Button>
                  </MagneticButton>
                )}
                {c.showHeroCv && (
                  <MagneticButton>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleDownloadCv}
                    >
                      <FileDown className="h-4 w-4" />
                      {l(c.heroCvLabel)}
                    </Button>
                  </MagneticButton>
                )}
                {c.showHeroX &&
                  xProfileHref(c.xProfileUrl || c.xUsername || "") && (
                    <MagneticButton>
                      <Button size="lg" variant="outline" asChild>
                        <a
                          href={
                            xProfileHref(c.xProfileUrl || c.xUsername || "")!
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <XLogo className="h-4 w-4" />
                          {l(c.heroXLabel) || "X"}
                        </a>
                      </Button>
                    </MagneticButton>
                  )}
              </div>
            </motion.div>
          </div>
        </GlassCard>

        <ShowreelEmbed />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <LocalizedField
              label="Titre"
              value={draft.title}
              onChange={(title) => setDraft({ ...draft, title })}
              id="title"
            />
            <LocalizedField
              label="Bio"
              value={draft.bio}
              onChange={(bio) => setDraft({ ...draft, bio })}
              multiline
              rows={4}
              id="bio"
            />
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <LocalizedField
              label="Localisation"
              value={draft.location}
              onChange={(location) => setDraft({ ...draft, location })}
              id="location"
            />
            <div className="grid gap-2">
              <Label htmlFor="showreel">URL Showreel</Label>
              <Input
                id="showreel"
                value={draft.showreelUrl}
                onChange={(e) =>
                  setDraft({ ...draft, showreelUrl: e.target.value })
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
                  setDraft({
                    ...draft,
                    cvUrl: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="h-px bg-white/10" />
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Noms des boutons (Hero)
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
              <LocalizedField
                label="Nom du bouton Showreel"
                value={heroShowreelLabel}
                onChange={setHeroShowreelLabel}
                placeholder="Voir le showreel"
                id="hero-showreel-label"
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
              <LocalizedField
                label="Nom du bouton CV"
                value={heroCvLabel}
                onChange={setHeroCvLabel}
                placeholder="Télécharger CV"
                id="hero-cv-label"
              />
            )}

            <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
              <span>Afficher téléphone</span>
              <input
                type="checkbox"
                checked={showHeroPhone}
                onChange={(e) => setShowHeroPhone(e.target.checked)}
                className="accent-teal-300"
              />
            </label>
            {showHeroPhone && (
              <LocalizedField
                label="Nom du bouton téléphone"
                value={heroPhoneLabel}
                onChange={setHeroPhoneLabel}
                placeholder="Vide = affiche le numéro"
                id="hero-phone-label"
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
              <LocalizedField
                label="Nom du bouton email"
                value={heroEmailLabel}
                onChange={setHeroEmailLabel}
                placeholder="Vide = affiche l’adresse"
                id="hero-email-label"
              />
            )}

            <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
              <span>Afficher bouton X</span>
              <input
                type="checkbox"
                checked={showHeroX}
                onChange={(e) => setShowHeroX(e.target.checked)}
                className="accent-teal-300"
              />
            </label>
            {showHeroX && (
              <>
                <LocalizedField
                  label="Nom du bouton X"
                  value={heroXLabel}
                  onChange={setHeroXLabel}
                  placeholder="X / Twitter"
                  id="hero-x-label"
                />
                <div className="grid gap-2">
                  <Label htmlFor="hero-x-url">Lien profil X</Label>
                  <Input
                    id="hero-x-url"
                    value={xProfileUrl}
                    onChange={(e) => setXProfileUrl(e.target.value)}
                    placeholder="https://x.com/votre_pseudo"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveProfile}>Enregistrer</Button>
          </DialogFooter>
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
          />
          <DialogFooter>
            <Button onClick={() => setPhotoOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SkillTag } from "@/components/skills/SkillTag";
import type {
  ContactConfig,
  QuickContactIcon,
  QuickContactLink,
  Translatable,
} from "@/lib/types";
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
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { getL, type MaybeLocalized } from "@/lib/i18n-content";
import { createId, cn } from "@/lib/utils";
import {
  QUICK_CONTACT_ICON_OPTIONS,
  QuickContactIconView,
} from "@/components/widgets/widget-icons";

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
};

function ToggleRow({ label, checked, onChange, children }: ToggleRowProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-teal-300"
        />
      </label>
      {checked && children && <div className="mt-3 grid gap-2">{children}</div>}
    </div>
  );
}

function ButtonNameField({
  value,
  onChange,
  placeholder,
}: {
  value: MaybeLocalized;
  onChange: (v: Translatable) => void;
  placeholder?: string;
}) {
  return (
    <LocalizedField
      label="Nom du bouton"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}

type ContactSettingsPanelProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export function ContactSettingsPanel({
  open,
  onOpenChange,
}: ContactSettingsPanelProps) {
  const { data, updateContact } = usePortfolio();
  const [draft, setDraft] = useState<ContactConfig>(data.contact);
  const [skillText, setSkillText] = useState(
    (data.contact.widgetSkillTags ?? []).join(", ")
  );

  useEffect(() => {
    if (open) {
      setDraft({ ...data.contact });
      setSkillText((data.contact.widgetSkillTags ?? []).join(", "));
    }
  }, [open, data.contact]);

  const set = <K extends keyof ContactConfig>(
    key: K,
    value: ContactConfig[K]
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const links = draft.quickContactLinks ?? [];

  const updateLink = (id: string, partial: Partial<QuickContactLink>) => {
    setDraft((d) => ({
      ...d,
      quickContactLinks: (d.quickContactLinks ?? []).map((link) =>
        link.id === id ? { ...link, ...partial } : link
      ),
    }));
  };

  const addLink = () => {
    const link: QuickContactLink = {
      id: createId(),
      icon: "link",
      label: "Nouveau lien",
      href: "https://",
    };
    setDraft((d) => ({
      ...d,
      quickContactLinks: [...(d.quickContactLinks ?? []), link],
    }));
  };

  const removeLink = (id: string) => {
    setDraft((d) => ({
      ...d,
      quickContactLinks: (d.quickContactLinks ?? []).filter(
        (link) => link.id !== id
      ),
    }));
  };

  const moveLink = (index: number, dir: -1 | 1) => {
    setDraft((d) => {
      const list = [...(d.quickContactLinks ?? [])];
      const j = index + dir;
      if (j < 0 || j >= list.length) return d;
      [list[index], list[j]] = [list[j], list[index]];
      return { ...d, quickContactLinks: list };
    });
  };

  const save = () => {
    const tags = skillText
      .split(/[,;\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    updateContact({
      ...draft,
      quickContactLinks: (draft.quickContactLinks ?? []).map((link) => ({
        ...link,
        label: getL(link.label).trim() ? link.label : "Lien",
        href: link.href.trim() || "#",
      })),
      widgetSkillTags: tags,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-teal-300" />
            Boutons, Contact & Widgets
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <LocalizedField
            label="Eyebrow section"
            value={draft.sectionEyebrow}
            onChange={(v) => set("sectionEyebrow", v)}
          />
          <LocalizedField
            label="Titre section"
            value={draft.sectionTitle}
            onChange={(v) => set("sectionTitle", v)}
          />
          <LocalizedField
            label="Texte d’introduction"
            value={draft.introText}
            onChange={(v) => set("introText", v)}
            multiline
            rows={2}
          />

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Boutons Hero (profil)
          </p>

          <ToggleRow
            label="Bouton Showreel (Hero)"
            checked={draft.showHeroShowreel}
            onChange={(v) => set("showHeroShowreel", v)}
          >
            <ButtonNameField
              value={draft.heroShowreelLabel}
              onChange={(v) => set("heroShowreelLabel", v)}
              placeholder="Voir le showreel"
            />
          </ToggleRow>

          <ToggleRow
            label="Bouton CV (Hero)"
            checked={draft.showHeroCv}
            onChange={(v) => set("showHeroCv", v)}
          >
            <ButtonNameField
              value={draft.heroCvLabel}
              onChange={(v) => set("heroCvLabel", v)}
              placeholder="Télécharger CV"
            />
          </ToggleRow>

          <ToggleRow
            label="Lien téléphone (Hero)"
            checked={draft.showHeroPhone}
            onChange={(v) => set("showHeroPhone", v)}
          >
            <ButtonNameField
              value={draft.heroPhoneLabel}
              onChange={(v) => set("heroPhoneLabel", v)}
              placeholder="Vide = affiche le numéro"
            />
          </ToggleRow>

          <ToggleRow
            label="Lien email (Hero)"
            checked={draft.showHeroEmail}
            onChange={(v) => set("showHeroEmail", v)}
          >
            <ButtonNameField
              value={draft.heroEmailLabel}
              onChange={(v) => set("heroEmailLabel", v)}
              placeholder="Vide = affiche l’adresse"
            />
          </ToggleRow>

          <ToggleRow
            label="Bouton X (Twitter) — Hero"
            checked={draft.showHeroX}
            onChange={(v) => set("showHeroX", v)}
          >
            <ButtonNameField
              value={draft.heroXLabel}
              onChange={(v) => set("heroXLabel", v)}
              placeholder="X / Twitter"
            />
            <Label className="text-xs text-zinc-400">Lien du profil X</Label>
            <Input
              value={draft.xProfileUrl}
              onChange={(e) => set("xProfileUrl", e.target.value)}
              placeholder="https://x.com/votre_pseudo"
            />
            <p className="text-[10px] text-zinc-500">
              Ouvre le profil dans un nouvel onglet.
            </p>
          </ToggleRow>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Section Contact
          </p>

          <ToggleRow
            label="Nom & titre"
            checked={draft.showNameTitle}
            onChange={(v) => set("showNameTitle", v)}
          />
          <ToggleRow
            label="Localisation"
            checked={draft.showLocation}
            onChange={(v) => set("showLocation", v)}
          />

          <ToggleRow
            label="Bouton Email"
            checked={draft.showEmail}
            onChange={(v) => set("showEmail", v)}
          >
            <ButtonNameField
              value={draft.emailLabel}
              onChange={(v) => set("emailLabel", v)}
              placeholder="Email, M’écrire…"
            />
            <Label className="text-xs text-zinc-400">
              Valeur email (vide = profil)
            </Label>
            <Input
              value={draft.emailValue}
              onChange={(e) => set("emailValue", e.target.value)}
              placeholder={data.profile.email}
            />
          </ToggleRow>

          <ToggleRow
            label="Bouton Téléphone"
            checked={draft.showPhone}
            onChange={(v) => set("showPhone", v)}
          >
            <ButtonNameField
              value={draft.phoneLabel}
              onChange={(v) => set("phoneLabel", v)}
              placeholder="Appeler, Me joindre…"
            />
            <Label className="text-xs text-zinc-400">
              Valeur téléphone (vide = profil)
            </Label>
            <Input
              value={draft.phoneValue}
              onChange={(e) => set("phoneValue", e.target.value)}
              placeholder={data.profile.phone}
            />
          </ToggleRow>

          <ToggleRow
            label="Bouton Showreel"
            checked={draft.showShowreel}
            onChange={(v) => set("showShowreel", v)}
          >
            <ButtonNameField
              value={draft.showreelLabel}
              onChange={(v) => set("showreelLabel", v)}
              placeholder="Showreel, Voir mon travail…"
            />
            <Label className="text-xs text-zinc-400">
              URL showreel (vide = profil)
            </Label>
            <Input
              value={draft.showreelUrl}
              onChange={(e) => set("showreelUrl", e.target.value)}
              placeholder={data.profile.showreelUrl}
            />
          </ToggleRow>

          <ToggleRow
            label="Lien copier l’email"
            checked={draft.showCopyEmail}
            onChange={(v) => set("showCopyEmail", v)}
          >
            <ButtonNameField
              value={draft.copyEmailLabel}
              onChange={(v) => set("copyEmailLabel", v)}
              placeholder="Vide = affiche l’adresse email"
            />
          </ToggleRow>

          <ToggleRow
            label="Formulaire de message rapide"
            checked={draft.showForm}
            onChange={(v) => set("showForm", v)}
          >
            <LocalizedField
              label="Titre du formulaire"
              value={draft.formTitle}
              onChange={(v) => set("formTitle", v)}
            />
            <ButtonNameField
              value={draft.formSubmitLabel}
              onChange={(v) => set("formSubmitLabel", v)}
              placeholder="Envoyer via mail"
            />
          </ToggleRow>

          {/* —— Widgets —— */}
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Widget Contact rapide
          </p>

          <ToggleRow
            label="Afficher le widget"
            checked={draft.showWidgetQuickContact}
            onChange={(v) => set("showWidgetQuickContact", v)}
          >
            <LocalizedField
              label="Titre du widget"
              value={draft.widgetQuickContactTitle}
              onChange={(v) => set("widgetQuickContactTitle", v)}
            />

            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-300">
                  Lignes ({links.length})
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={addLink}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une ligne
                </Button>
              </div>

              {links.length === 0 && (
                <p className="text-xs text-zinc-500">
                  Aucune ligne. Ajoutez email, téléphone, réseaux…
                </p>
              )}

              {links.map((link, index) => (
                <div
                  key={link.id}
                  className="grid gap-2 rounded-xl border border-white/10 bg-black/30 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300">
                      Ligne {index + 1}
                    </span>
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => moveLink(index, -1)}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={index === links.length - 1}
                        onClick={() => moveLink(index, 1)}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400"
                        onClick={() => removeLink(link.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-xs text-zinc-400">Icône</Label>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_CONTACT_ICON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          title={opt.label}
                          onClick={() =>
                            updateLink(link.id, {
                              icon: opt.value as QuickContactIcon,
                            })
                          }
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                            link.icon === opt.value
                              ? "border-teal-300/50 bg-teal-300/15 text-teal-200"
                              : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                          )}
                        >
                          <QuickContactIconView
                            name={opt.value}
                            className="h-3.5 w-3.5"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <LocalizedField
                    label="Nom du bouton / texte affiché"
                    value={link.label}
                    onChange={(v) => updateLink(link.id, { label: v })}
                    placeholder="Email, LinkedIn…"
                  />

                  <div className="grid gap-1.5">
                    <Label className="text-xs text-zinc-400">
                      Lien / action
                    </Label>
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateLink(link.id, { href: e.target.value })
                      }
                      placeholder="mailto:…, tel:…, https://…"
                    />
                    <p className="text-[10px] text-zinc-500">
                      Ex. mailto:contact@mail.com · tel:0612345678 ·
                      https://linkedin.com/in/…
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ToggleRow>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Widget Top skills
          </p>

          <ToggleRow
            label="Afficher le widget"
            checked={draft.showWidgetSkills}
            onChange={(v) => set("showWidgetSkills", v)}
          >
            <LocalizedField
              label="Titre du widget"
              value={draft.widgetSkillsTitle}
              onChange={(v) => set("widgetSkillsTitle", v)}
            />
            <Label className="text-xs font-medium text-teal-200/90">
              Tags de compétences
            </Label>
            <Textarea
              value={skillText}
              onChange={(e) => setSkillText(e.target.value)}
              rows={4}
              placeholder="Premiere Pro, After Effects, Motion design…"
            />
            <p className="text-[10px] text-zinc-500">
              Séparez les tags par des virgules. Ordre = ordre d’affichage.
              Ajoutez, renommez ou supprimez librement.
            </p>
            {skillText.trim() && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skillText
                  .split(/[,;\n]/)
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <SkillTag
                      key={tag}
                      label={tag}
                      variant="secondary"
                      className="text-[10px]"
                    />
                  ))}
              </div>
            )}
          </ToggleRow>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Widget Disponibilité
          </p>

          <ToggleRow
            label="Disponibilité"
            checked={draft.showWidgetAvailability}
            onChange={(v) => set("showWidgetAvailability", v)}
          >
            <LocalizedField
              label="Titre"
              value={draft.widgetAvailabilityTitle}
              onChange={(v) => set("widgetAvailabilityTitle", v)}
            />
            <LocalizedField
              label="Texte"
              value={draft.widgetAvailabilityText}
              onChange={(v) => set("widgetAvailabilityText", v)}
            />
          </ToggleRow>

          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Widget feed X
          </p>

          <ToggleRow
            label="Afficher le feed X (sidebar)"
            checked={draft.showWidgetXFeed}
            onChange={(v) => set("showWidgetXFeed", v)}
          >
            <LocalizedField
              label="Titre du widget"
              value={draft.widgetXFeedTitle}
              onChange={(v) => set("widgetXFeedTitle", v)}
              placeholder="Sur X"
            />
            <Label className="text-xs text-zinc-400">
              Nom d’utilisateur X (@pseudo)
            </Label>
            <Input
              value={draft.xUsername}
              onChange={(e) => set("xUsername", e.target.value)}
              placeholder="@votre_pseudo ou votre_pseudo"
            />
            <Label className="text-xs text-zinc-400">
              Lien profil (si différent)
            </Label>
            <Input
              value={draft.xProfileUrl}
              onChange={(e) => set("xProfileUrl", e.target.value)}
              placeholder="https://x.com/votre_pseudo"
            />
            <p className="text-[10px] text-zinc-500">
              Timeline officielle X (thème sombre). Visible sur grand écran
              (sidebar). Un bloqueur de pubs peut empêcher l’embed.
            </p>
          </ToggleRow>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={save}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import type { Skill, SkillIcon } from "@/lib/types";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { createId } from "@/lib/utils";

const CATEGORY_ORDER = [
  "Montage vidéo",
  "Motion design",
  "Vidéo réseaux sociaux",
  "Graphisme",
  "Autres",
];

const QUICK_EMOJIS = [
  "🎬",
  "✂️",
  "🎨",
  "✨",
  "📱",
  "🖼️",
  "⚡",
  "🎞️",
  "🌈",
  "🌍",
  "📦",
  "▶️",
  "✏️",
  "📄",
  "🗣️",
  "🍎",
];

export type SkillFormState = {
  name: LocalizedString;
  level: number;
  category: LocalizedString;
  description: LocalizedString;
  image: string | null;
  icons: SkillIcon[];
};

export function emptySkillForm(seedName = ""): SkillFormState {
  return {
    name: liftToLocalized(seedName),
    level: 80,
    category: liftToLocalized("Montage vidéo"),
    description: {},
    image: null,
    icons: [],
  };
}

export function formFromSkill(skill: Skill): SkillFormState {
  return {
    name: liftToLocalized(skill.name),
    level: skill.level ?? 50,
    category: liftToLocalized(skill.category || "Montage vidéo"),
    description: liftToLocalized(skill.description || ""),
    image: skill.image ?? null,
    icons: skill.icons?.map((i) => ({ ...i })) ?? [],
  };
}

type SkillEditDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** null = create */
  editing: Skill | null;
  /** Prefill name when creating from a tag */
  seedName?: string;
  onSave: (payload: Omit<Skill, "id">, editingId: string | null) => void;
};

export function SkillEditDialog({
  open,
  onOpenChange,
  editing,
  seedName = "",
  onSave,
}: SkillEditDialogProps) {
  const [form, setForm] = useState<SkillFormState>(emptySkillForm());
  const [iconEmoji, setIconEmoji] = useState("");
  const [iconLabel, setIconLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) setForm(formFromSkill(editing));
    else setForm(emptySkillForm(seedName));
    setIconEmoji("");
    setIconLabel("");
  }, [open, editing, seedName]);

  const addEmojiIcon = (emoji?: string) => {
    const e = (emoji || iconEmoji).trim();
    if (!e) return;
    setForm((f) => ({
      ...f,
      icons: [
        ...f.icons,
        {
          id: createId(),
          emoji: e,
          label: iconLabel.trim() || undefined,
        },
      ],
    }));
    setIconEmoji("");
    setIconLabel("");
  };

  const addUploadIcon = (src: string | null) => {
    if (!src) return;
    setForm((f) => ({
      ...f,
      icons: [
        ...f.icons,
        {
          id: createId(),
          src,
          label: iconLabel.trim() || undefined,
        },
      ],
    }));
    setIconLabel("");
  };

  const removeIcon = (id: string) => {
    setForm((f) => ({
      ...f,
      icons: f.icons.filter((i) => i.id !== id),
    }));
  };

  const handleSave = () => {
    if (!getL(form.name).trim()) return;

    // Propagate filled text into missing locales so skills stay visible in all languages
    const seedLocales = (value: LocalizedString): LocalizedString => {
      const seed =
        value.fr?.trim() ||
        value.en?.trim() ||
        value.pl?.trim() ||
        value.es?.trim() ||
        "";
      if (!seed) return value;
      return {
        fr: value.fr?.trim() || seed,
        en: value.en?.trim() || seed,
        pl: value.pl?.trim() || seed,
        es: value.es?.trim() || seed,
      };
    };

    const name = seedLocales(form.name);
    const category = getL(form.category).trim()
      ? seedLocales(form.category)
      : liftToLocalized("Autres");
    const description = getL(form.description).trim()
      ? seedLocales(form.description)
      : undefined;

    onSave(
      {
        name,
        level: Math.min(100, Math.max(0, form.level)),
        category,
        description,
        image: form.image,
        icons: form.icons,
      },
      editing?.id ?? null
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Modifier la compétence" : "Ajouter une compétence"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <LocalizedField
            label="Nom"
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            placeholder="Adobe Premiere Pro"
            id="gsk-name"
          />

          <LocalizedField
            label="Catégorie"
            value={form.category}
            onChange={(category) => setForm((f) => ({ ...f, category }))}
            placeholder="Montage vidéo"
            id="gsk-cat"
          />
          <datalist id="g-skill-cats">
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="grid gap-2">
            <Label htmlFor="gsk-level">Niveau : {form.level}%</Label>
            <input
              id="gsk-level"
              type="range"
              min={0}
              max={100}
              value={form.level}
              onChange={(e) =>
                setForm((f) => ({ ...f, level: Number(e.target.value) }))
              }
              className="w-full accent-teal-300"
            />
          </div>

          <LocalizedField
            label="Texte d’explication"
            value={form.description}
            onChange={(description) => setForm((f) => ({ ...f, description }))}
            multiline
            rows={4}
            placeholder="Décrivez l’expertise, les contextes d’usage…"
            id="gsk-desc"
          />

          <div className="grid gap-2">
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-teal-300" />
              Photo
            </Label>
            <ImageUpload
              value={form.image}
              onChange={(image) => setForm((f) => ({ ...f, image }))}
              aspectClassName="aspect-video max-h-44 w-full"
              label="Image illustrative (optionnel)"
              folder="patrick-roziel/skills"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
                Icônes
              </p>
              <p className="text-[10px] text-zinc-500">
                Emoji ou image — affichées sur la carte détail
              </p>
            </div>

            {form.icons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.icons.map((ic) => (
                  <div
                    key={ic.id}
                    className="glass-chip group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-lg"
                  >
                    {ic.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ic.src}
                        alt={getL(ic.label) || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      ic.emoji
                    )}
                    <button
                      type="button"
                      onClick={() => removeIcon(ic.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/70 text-zinc-300 opacity-0 transition group-hover:opacity-100"
                      aria-label="Retirer l’icône"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => addEmojiIcon(e)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-base transition hover:border-teal-300/40 hover:bg-teal-300/10"
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={iconEmoji}
                onChange={(e) => setIconEmoji(e.target.value)}
                placeholder="Emoji perso"
                maxLength={8}
              />
              <Input
                value={iconLabel}
                onChange={(e) => setIconLabel(e.target.value)}
                placeholder="Libellé (optionnel)"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addEmojiIcon()}
                disabled={!iconEmoji.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
                Emoji
              </Button>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-zinc-400">
                Ou uploader une icône image
              </Label>
              <ImageUpload
                value={null}
                onChange={addUploadIcon}
                aspectClassName="aspect-square max-h-20 max-w-20"
                label="PNG / SVG / WebP"
                folder="patrick-roziel/skills"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!getL(form.name).trim()}>
            {editing ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

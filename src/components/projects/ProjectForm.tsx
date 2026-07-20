"use client";

import { useState } from "react";
import { ImageIcon, Video, AtSign } from "lucide-react";
import type { Project, ProjectMediaType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { isYoutubeUrl, isXUrl, cn } from "@/lib/utils";

export type ProjectFormValues = Omit<Project, "id">;

type ProjectFormProps = {
  initial?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

function initialMediaType(
  initial?: Partial<ProjectFormValues>
): ProjectMediaType {
  if (
    initial?.mediaType === "image" ||
    initial?.mediaType === "youtube" ||
    initial?.mediaType === "x"
  ) {
    return initial.mediaType;
  }
  // Legacy "video"
  if ((initial as { mediaType?: string })?.mediaType === "video") {
    if (initial?.videoUrl && isXUrl(initial.videoUrl)) return "x";
    return "youtube";
  }
  if (initial?.videoUrl) {
    if (isXUrl(initial.videoUrl)) return "x";
    if (isYoutubeUrl(initial.videoUrl)) return "youtube";
  }
  return "image";
}

const MEDIA_OPTIONS: {
  type: ProjectMediaType;
  label: string;
  icon: typeof ImageIcon;
}[] = [
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "youtube", label: "YouTube", icon: Video },
  { type: "x", label: "X", icon: AtSign },
];

export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: ProjectFormProps) {
  const [title, setTitle] = useState<LocalizedString>(
    liftToLocalized(initial?.title)
  );
  const [description, setDescription] = useState<LocalizedString>(
    liftToLocalized(initial?.description)
  );
  const [longDescription, setLongDescription] = useState<LocalizedString>(
    liftToLocalized(initial?.longDescription)
  );
  const [mediaType, setMediaType] = useState<ProjectMediaType>(
    initialMediaType(initial)
  );
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [mediaUrl, setMediaUrl] = useState(initial?.videoUrl ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [link, setLink] = useState(initial?.link ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!getL(title).trim() || !getL(description).trim()) {
      setError("Titre et description courte sont obligatoires.");
      return;
    }

    let videoUrl: string | null = null;

    if (mediaType === "youtube") {
      const url = mediaUrl.trim();
      if (!url) {
        setError("Collez un lien YouTube.");
        return;
      }
      if (!isYoutubeUrl(url)) {
        setError(
          "Lien YouTube invalide. Ex. : https://youtu.be/… ou youtube.com/watch?v=…"
        );
        return;
      }
      videoUrl = url;
    }

    if (mediaType === "x") {
      const url = mediaUrl.trim();
      if (!url) {
        setError("Collez le lien du post ou de la vidéo X.");
        return;
      }
      if (!isXUrl(url)) {
        setError(
          "Lien X invalide. Ex. : https://x.com/user/status/123… ou twitter.com/…"
        );
        return;
      }
      videoUrl = url;
    }

    onSubmit({
      title,
      description,
      longDescription: getL(longDescription).trim()
        ? longDescription
        : undefined,
      mediaType,
      image,
      videoUrl: mediaType === "image" ? null : videoUrl,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      link: link.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label>Type de média de couverture</Label>
        <div className="grid grid-cols-3 gap-2">
          {MEDIA_OPTIONS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setMediaType(type);
                setError(null);
                // Keep URL when switching youtube ↔ x if user re-pastes
                if (type === "image") setMediaUrl("");
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition sm:text-sm",
                mediaType === type
                  ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {mediaType === "image" && (
        <div className="grid gap-2">
          <Label>Image du projet</Label>
          <ImageUpload value={image} onChange={setImage} />
        </div>
      )}

      {mediaType === "youtube" && (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="yt-url">Lien YouTube</Label>
            <Input
              id="yt-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://youtu.be/… ou https://www.youtube.com/watch?v=…"
            />
            <p className="text-xs text-zinc-500">
              Autoplay muet en boucle dès que la carte est visible. Embed généré
              automatiquement.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Miniature (optionnel)</Label>
            <ImageUpload
              value={image}
              onChange={setImage}
              aspectClassName="aspect-video max-h-28"
              label="Poster avant lecture"
            />
          </div>
        </div>
      )}

      {mediaType === "x" && (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="x-url">Lien du post / vidéo X</Label>
            <Input
              id="x-url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://x.com/user/status/…"
            />
            <p className="text-xs text-zinc-500">
              Collez l’URL du post (x.com ou twitter.com). L’embed officiel
              s’affiche dans la carte glass.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Image de secours (optionnel)</Label>
            <ImageUpload
              value={image}
              onChange={setImage}
              aspectClassName="aspect-video max-h-28"
              label="Affichée avant le chargement de l’embed"
            />
          </div>
        </div>
      )}

      <LocalizedField
        label="Titre *"
        value={title}
        onChange={setTitle}
        placeholder="Showreel 2024"
        id="ptitle"
      />
      <LocalizedField
        label="Description courte *"
        value={description}
        onChange={setDescription}
        multiline
        rows={2}
        id="pdesc"
      />
      <LocalizedField
        label="Description détaillée"
        value={longDescription}
        onChange={setLongDescription}
        multiline
        rows={4}
        id="plong"
      />
      <div className="grid gap-2">
        <Label htmlFor="ptags">Tags (virgules)</Label>
        <Input
          id="ptags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Premiere Pro, Motion, After Effects"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="plink">Lien externe (optionnel)</Label>
        <Input
          id="plink"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

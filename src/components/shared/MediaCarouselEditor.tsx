"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Plus,
  Trash2,
  Video,
  Link2,
  Film,
} from "lucide-react";
import type { MediaItem, MediaItemType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary";
import { createId, isXUrl, isYoutubeUrl, cn } from "@/lib/utils";

type MediaCarouselEditorProps = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

const TYPES: { type: MediaItemType; label: string; icon: typeof ImageIcon }[] = [
  { type: "image", label: "Photo", icon: ImageIcon },
  { type: "youtube", label: "YouTube", icon: Video },
  { type: "x", label: "X", icon: Link2 },
  { type: "file", label: "Vidéo", icon: Film },
];

export function MediaCarouselEditor({
  items,
  onChange,
}: MediaCarouselEditorProps) {
  const [addType, setAddType] = useState<MediaItemType>("image");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addImage = (url: string | null) => {
    if (!url) return;
    onChange([
      ...items,
      { id: createId(), type: "image", url },
    ]);
  };

  const addFile = (url: string | null) => {
    if (!url) return;
    onChange([
      ...items,
      { id: createId(), type: "file", url },
    ]);
  };

  const addLink = () => {
    setError(null);
    const url = link.trim();
    if (!url) {
      setError("Collez un lien.");
      return;
    }
    if (addType === "youtube") {
      if (!isYoutubeUrl(url)) {
        setError("Lien YouTube invalide.");
        return;
      }
      onChange([...items, { id: createId(), type: "youtube", url }]);
    } else if (addType === "x") {
      if (!isXUrl(url)) {
        setError("Lien X invalide.");
        return;
      }
      onChange([...items, { id: createId(), type: "x", url }]);
    }
    setLink("");
  };

  const remove = (id: string) => onChange(items.filter((m) => m.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-zinc-300">Carrousel médias (optionnel)</Label>
        <span className="text-[10px] text-zinc-500">{items.length} média(s)</span>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((m, i) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2"
            >
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-black/40">
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] uppercase text-zinc-500">
                    {m.type}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium capitalize text-zinc-200">
                  {m.type}
                </p>
                <p className="truncate text-[10px] text-zinc-500">{m.url}</p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-400"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setAddType(type);
              setError(null);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium",
              addType === type
                ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                : "border-white/10 bg-white/5 text-zinc-400"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {addType === "image" && (
        <ImageUpload
          value={null}
          onChange={addImage}
          aspectClassName="aspect-video max-h-28"
          label="Ajouter une photo"
          folder={CLOUDINARY_FOLDERS.projects}
        />
      )}
      {addType === "file" && (
        <VideoUpload
          value={null}
          onChange={addFile}
          label="Ajouter une vidéo"
          folder={CLOUDINARY_FOLDERS.projects}
        />
      )}
      {(addType === "youtube" || addType === "x") && (
        <div className="flex gap-2">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder={
              addType === "youtube"
                ? "https://youtu.be/…"
                : "https://x.com/…/status/…"
            }
          />
          <Button type="button" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

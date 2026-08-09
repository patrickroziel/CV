"use client";

import { useRef, useState } from "react";
import {
  Film,
  GripVertical,
  ImageIcon,
  Plus,
  Trash2,
  Video,
  Link2,
} from "lucide-react";
import type { MediaItem, MediaItemType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { MEDIA_FOLDERS } from "@/lib/blob-upload";
import {
  createId,
  isXUrl,
  isYoutubeUrl,
  youtubeThumb,
  cn,
} from "@/lib/utils";

type MediaCarouselEditorProps = {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
};

type AddMode = "image" | "file" | "youtube";

const ACTIONS: {
  mode: AddMode;
  label: string;
  icon: typeof ImageIcon;
}[] = [
  { mode: "image", label: "Photo", icon: ImageIcon },
  { mode: "file", label: "Vidéo", icon: Film },
  { mode: "youtube", label: "YouTube", icon: Video },
];

function thumbFor(item: MediaItem): string | null {
  if (item.type === "image") return item.url;
  if (item.type === "youtube") return youtubeThumb(item.url);
  return null;
}

export function MediaCarouselEditor({
  items,
  onChange,
}: MediaCarouselEditorProps) {
  const [mode, setMode] = useState<AddMode>("image");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const addImage = (url: string | null) => {
    if (!url) return;
    onChange([...items, { id: createId(), type: "image", url }]);
  };

  const addFile = (url: string | null) => {
    if (!url) return;
    onChange([...items, { id: createId(), type: "file", url }]);
  };

  const addYoutube = () => {
    setError(null);
    const url = link.trim();
    if (!url) {
      setError("Collez un lien YouTube.");
      return;
    }
    if (!isYoutubeUrl(url)) {
      setError("Lien YouTube invalide.");
      return;
    }
    onChange([...items, { id: createId(), type: "youtube", url }]);
    setLink("");
  };

  const addX = () => {
    setError(null);
    const url = link.trim();
    if (!url) {
      setError("Collez un lien X.");
      return;
    }
    if (!isXUrl(url)) {
      setError("Lien X invalide.");
      return;
    }
    onChange([...items, { id: createId(), type: "x" as MediaItemType, url }]);
    setLink("");
  };

  const remove = (id: string) => onChange(items.filter((m) => m.id !== id));

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = items.findIndex((m) => m.id === fromId);
    const to = items.findIndex((m) => m.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-300">Carrousel médias</p>
        {items.length > 0 && (
          <span className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-medium tabular-nums text-zinc-300">
            {items.length === 1
              ? "1 média"
              : `${items.length} médias`}
          </span>
        )}
      </div>

      {/* Preview strip — drag to reorder */}
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((m, i) => {
            const thumb = thumbFor(m);
            const isOver = overId === m.id && dragId && dragId !== m.id;
            return (
              <li
                key={m.id}
                draggable
                onDragStart={(e) => {
                  dragIdRef.current = m.id;
                  setDragId(m.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", m.id);
                }}
                onDragEnd={() => {
                  dragIdRef.current = null;
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverId(m.id);
                }}
                onDragLeave={() => {
                  setOverId((id) => (id === m.id ? null : id));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from =
                    e.dataTransfer.getData("text/plain") || dragIdRef.current;
                  if (from) reorder(from, m.id);
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "group relative aspect-square w-[5.5rem] sm:w-[6.25rem] shrink-0 cursor-grab overflow-hidden rounded-xl",
                  "border border-white/15 bg-black/40 active:cursor-grabbing",
                  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]",
                  "transition",
                  dragId === m.id && "opacity-50",
                  isOver && "border-teal-300/50 ring-2 ring-teal-300/30"
                )}
                title="Glisser pour réordonner"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-0.5 bg-gradient-to-br from-zinc-800 to-zinc-950 text-[9px] uppercase text-zinc-500">
                    {m.type === "file" ? (
                      <Film className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {m.type}
                  </div>
                )}
                <span className="absolute left-1 top-1 rounded bg-black/55 px-1 text-[9px] font-semibold tabular-nums text-zinc-200 backdrop-blur-sm">
                  {i + 1}
                </span>
                <span className="absolute right-0.5 top-0.5 rounded p-0.5 text-zinc-400 opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className={cn(
                    "absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full",
                    "border border-white/15 bg-black/60 text-red-300 opacity-0 backdrop-blur-md",
                    "transition hover:bg-red-500/20 group-hover:opacity-100"
                  )}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Glass action bar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/15 p-1.5",
          "bg-[linear-gradient(155deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)),rgba(9,9,12,0.55)]",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
        )}
      >
        {ACTIONS.map(({ mode: m, label, icon: Icon }) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:flex-none",
              mode === m
                ? "border border-teal-300/35 bg-teal-300/15 text-teal-100 shadow-[0_0_16px_-4px_rgba(94,234,212,0.45)]"
                : "border border-transparent text-zinc-300 hover:bg-white/8 hover:text-white"
            )}
          >
            <Plus className="h-3.5 w-3.5 opacity-70" />
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Add zone */}
      <div className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-md">
        {mode === "image" && (
          <ImageUpload
            value={null}
            onChange={addImage}
            aspectClassName="aspect-square max-h-36"
            label="Ajouter une photo (carré conseillé)"
            folder={MEDIA_FOLDERS.projects}
          />
        )}
        {mode === "file" && (
          <VideoUpload
            value={null}
            onChange={addFile}
            label="Ajouter une vidéo (autoplay muet + loop)"
            folder={MEDIA_FOLDERS.projects}
          />
        )}
        {mode === "youtube" && (
          <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://youtu.be/… ou https://x.com/…/status/…"
                className="flex-1"
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={addYoutube}>
                  <Video className="h-4 w-4" />
                  YouTube
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={addX}
                >
                  <Link2 className="h-4 w-4" />
                  X
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500">
              YouTube : lecture auto muette en boucle dans une carte 1:1.
            </p>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}

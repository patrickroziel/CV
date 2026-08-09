"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Film,
  ImageIcon,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_BACKGROUND } from "@/lib/defaults";
import { normalizeBackgroundImages, normalizeHeroGlass } from "@/lib/storage";
import {
  DEFAULT_HERO_GLASS,
  type BackgroundImage,
  type HeroGlassBackMedia,
  type HeroGlassConfig,
  type HeroGlassFrontLayer,
} from "@/lib/types";
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
import { VideoUpload } from "@/components/shared/VideoUpload";
import { MEDIA_FOLDERS } from "@/lib/blob-upload";
import { createId, cn } from "@/lib/utils";

type WallpaperEditorProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function newDefaultImage(url: string = DEFAULT_BACKGROUND): BackgroundImage {
  return {
    id: createId(),
    url,
    opacity: 1,
    alphaVideoUrl: null,
    alphaVideoEnabled: false,
    alphaVideoOpacity: 0.85,
  };
}

export function WallpaperEditor({ open, onOpenChange }: WallpaperEditorProps) {
  const { data, updateAppearance } = usePortfolio();
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [heroGlass, setHeroGlass] = useState<HeroGlassConfig>(DEFAULT_HERO_GLASS);
  const [overlay, setOverlay] = useState(data.ui.overlayOpacity);
  const [showDock, setShowDock] = useState(data.ui.showDock);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setImages(
      normalizeBackgroundImages(
        data.backgroundImages,
        data.backgroundUrl || DEFAULT_BACKGROUND
      )
    );
    setHeroGlass(normalizeHeroGlass(data.heroGlass ?? DEFAULT_HERO_GLASS));
    setOverlay(data.ui.overlayOpacity);
    setShowDock(data.ui.showDock);
    setUrlInput("");
    setUrlError(null);
  }, [open, data.backgroundImages, data.backgroundUrl, data.heroGlass, data.ui]);

  const addImage = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setImages((prev) => {
      if (prev.some((img) => img.url === trimmed)) return prev;
      return [...prev, newDefaultImage(trimmed)];
    });
  };

  const addFromUrl = () => {
    setUrlError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Collez une URL d’image.");
      return;
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        setUrlError("URL http(s) requise.");
        return;
      }
    } catch {
      setUrlError("URL invalide.");
      return;
    }
    addImage(trimmed);
    setUrlInput("");
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const resetDefault = () => {
    setImages([newDefaultImage(DEFAULT_BACKGROUND)]);
  };

  const addBackMedia = (
    url: string | null,
    type: HeroGlassBackMedia["type"]
  ) => {
    if (!url) return;
    setHeroGlass((prev) => ({
      ...prev,
      backVideos: [
        ...prev.backVideos,
        {
          id: createId(),
          url,
          type,
          enabled: true,
          opacity: 1,
          fallbackImageUrl: null,
        },
      ],
    }));
  };

  const updateBackMedia = (
    id: string,
    partial: Partial<HeroGlassBackMedia>
  ) => {
    setHeroGlass((prev) => ({
      ...prev,
      backVideos: prev.backVideos.map((v) =>
        v.id === id ? { ...v, ...partial } : v
      ),
    }));
  };

  const removeBackMedia = (id: string) => {
    setHeroGlass((prev) => ({
      ...prev,
      backVideos: prev.backVideos.filter((v) => v.id !== id),
    }));
  };

  const setFront = (partial: Partial<HeroGlassFrontLayer>) => {
    setHeroGlass((prev) => ({
      ...prev,
      front: { ...prev.front, ...partial },
    }));
  };

  const apply = () => {
    const list = images.length > 0 ? images : [newDefaultImage()];
    updateAppearance(
      list,
      { overlayOpacity: overlay, showDock },
      normalizeHeroGlass(heroGlass)
    );
    onOpenChange(false);
  };

  const updateImage = (id: string, partial: Partial<BackgroundImage>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...partial } : img))
    );
  };

  const front = heroGlass.front;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="form"
        className={cn(
          // Full window always on-screen: fixed chrome, body scrolls inside
          "flex flex-col gap-0 overflow-hidden p-0"
        )}
      >
        <div className="shrink-0 border-b border-white/10 px-6 pb-3 pt-6 pr-12">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-teal-300" />
              Apparence
            </DialogTitle>
            <p className="text-xs text-zinc-500">
              Fonds, vidéos alpha et couches Hero — défilez le contenu si
              besoin ; le bandeau et les boutons restent visibles.
            </p>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
        <div className="grid gap-4">
          {/* —— Wallpapers —— */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Fonds d’écran ({images.length})</Label>
              <p className="text-[10px] text-zinc-500">
                Une image aléatoire à chaque visite
              </p>
            </div>

            {images.length === 0 && (
              <p className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-4 text-center text-xs text-zinc-500">
                Aucune image. Uploadez un fond ou ajoutez une URL.
              </p>
            )}

            <ul className="space-y-2">
              {images.map((img, index) => {
                const alphaOn = Boolean(
                  img.alphaVideoEnabled && img.alphaVideoUrl?.trim()
                );
                const alphaOpacity =
                  typeof img.alphaVideoOpacity === "number"
                    ? img.alphaVideoOpacity
                    : 0.85;
                const imgOpacity =
                  typeof img.opacity === "number" ? img.opacity : 1;
                return (
                  <li
                    key={img.id}
                    className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover bg-black/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "0.3";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-zinc-300">
                          Image {index + 1}
                          {alphaOn && (
                            <span className="ml-1.5 text-[10px] font-normal text-teal-300/90">
                              · alpha on
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[10px] text-zinc-500">
                          {img.url}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === 0}
                          onClick={() => moveImage(index, -1)}
                          aria-label="Monter"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(index, 1)}
                          aria-label="Descendre"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 text-red-400"
                        onClick={() => removeImage(img.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-1 px-0.5">
                      <Label className="text-[10px] text-zinc-500">
                        Opacité image : {Math.round(imgOpacity * 100)}%
                      </Label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.02}
                        value={imgOpacity}
                        onChange={(e) =>
                          updateImage(img.id, {
                            opacity: Number(e.target.value),
                          })
                        }
                        className="w-full accent-teal-300"
                      />
                    </div>

                    {/* Per-wallpaper alpha video (transparency preserved at runtime) */}
                    <div className="grid gap-2 rounded-lg border border-white/8 bg-black/25 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
                          <Film className="h-3.5 w-3.5 text-teal-300" />
                          Vidéo alpha (transparence)
                        </p>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-teal-300"
                            checked={Boolean(img.alphaVideoEnabled)}
                            disabled={!img.alphaVideoUrl?.trim()}
                            onChange={(e) =>
                              updateImage(img.id, {
                                alphaVideoEnabled: e.target.checked,
                              })
                            }
                          />
                          Activer
                        </label>
                      </div>
                      <VideoUpload
                        value={img.alphaVideoUrl ?? null}
                        onChange={(url) =>
                          updateImage(img.id, {
                            alphaVideoUrl: url,
                            alphaVideoEnabled: Boolean(url),
                          })
                        }
                        formats="webm-mp4"
                        compact
                        label="WebM alpha (recommandé) / MOV / MP4"
                        folder={MEDIA_FOLDERS.wallpaper}
                      />
                      {img.alphaVideoUrl?.trim() && (
                        <div className="grid gap-1">
                          <Label className="text-[10px] text-zinc-500">
                            Opacité alpha : {Math.round(alphaOpacity * 100)}%
                          </Label>
                          <input
                            type="range"
                            min={0.15}
                            max={1}
                            step={0.02}
                            value={alphaOpacity}
                            onChange={(e) =>
                              updateImage(img.id, {
                                alphaVideoOpacity: Number(e.target.value),
                              })
                            }
                            className="w-full accent-teal-300"
                          />
                          <p className="text-[10px] leading-snug text-zinc-600">
                            Préférez un{" "}
                            <strong className="font-medium text-zinc-500">
                              WebM VP9 avec canal alpha
                            </strong>{" "}
                            pour une vraie transparence (pas de fond noir).
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-2">
            <Label>Ajouter un fond (Vercel Blob)</Label>
            <ImageUpload
              value={null}
              onChange={(url) => {
                if (url) addImage(url);
              }}
              aspectClassName="aspect-video max-h-36"
              label="Upload un fond (JPG, PNG, WebP)"
              folder={MEDIA_FOLDERS.wallpaper}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bg-url">Ou coller une URL externe</Label>
            <div className="flex gap-2">
              <Input
                id="bg-url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }}
                placeholder="https://…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFromUrl();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="shrink-0"
                onClick={addFromUrl}
                aria-label="Ajouter l’URL"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {urlError && <p className="text-xs text-red-400">{urlError}</p>}
          </div>

          {/* —— Hero glass layers —— */}
          <div className="h-px bg-white/10" />
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Hero — couches vitre
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Plus de gouttes générées. Deux couches média contrôlables : arrière
            (derrière le glass) et avant (texture sur la vitre, sous le texte).
          </p>

          {/* Layer 1 */}
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Couche 1 — Arrière (derrière le glass)
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                Images ou vidéos alpha (WebM / MOV / PNG…). Cochez celles
                éligibles : une est tirée au hasard à chaque visite. Les vidéos
                en loop + muted, floutées par le glassmorphism.
              </p>
            </div>

            {heroGlass.backVideos.length === 0 && (
              <p className="text-xs text-zinc-500">
                Aucun média. Uploadez une image ou une vidéo alpha ci-dessous.
              </p>
            )}

            <ul className="space-y-3">
              {heroGlass.backVideos.map((v, i) => (
                <li
                  key={v.id}
                  className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-2"
                >
                  <div className="flex items-center gap-2">
                    <label className="flex shrink-0 items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={v.enabled}
                        onChange={(e) =>
                          updateBackMedia(v.id, { enabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-teal-300"
                      />
                      On
                    </label>
                    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-black/40">
                      {v.type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : v.fallbackImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.fallbackImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={v.url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-[10px] font-medium text-teal-200/90">
                        {v.type === "image" ? (
                          <ImageIcon className="h-3 w-3 shrink-0" />
                        ) : (
                          <Film className="h-3 w-3 shrink-0" />
                        )}
                        {v.type === "image" ? "Image" : "Vidéo"} {i + 1}
                      </p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {v.url}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-red-400"
                      onClick={() => removeBackMedia(v.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-1 border-t border-white/5 pt-2">
                    <Label className="text-[10px] text-zinc-500">
                      Opacité média :{" "}
                      {Math.round(
                        (typeof v.opacity === "number" ? v.opacity : 1) * 100
                      )}
                      %
                    </Label>
                    <input
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.02}
                      value={typeof v.opacity === "number" ? v.opacity : 1}
                      onChange={(e) =>
                        updateBackMedia(v.id, {
                          opacity: Number(e.target.value),
                        })
                      }
                      className="w-full accent-teal-300"
                    />
                  </div>
                  {v.type === "video" && (
                    <div className="grid gap-1.5 border-t border-white/5 pt-2">
                      <p className="text-[10px] text-zinc-500">
                        Image de secours (si la vidéo ne charge pas)
                      </p>
                      <ImageUpload
                        value={v.fallbackImageUrl ?? null}
                        onChange={(url) =>
                          updateBackMedia(v.id, { fallbackImageUrl: url })
                        }
                        aspectClassName="aspect-video max-h-24"
                        label="Image de secours"
                        folder={MEDIA_FOLDERS.wallpaper}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="grid gap-2 sm:grid-cols-2">
              <VideoUpload
                value={null}
                onChange={(url) => addBackMedia(url, "video")}
                formats="webm-mp4"
                compact
                label="Ajouter vidéo alpha"
                folder={MEDIA_FOLDERS.wallpaper}
              />
              <ImageUpload
                value={null}
                onChange={(url) => addBackMedia(url, "image")}
                aspectClassName="aspect-video max-h-28"
                label="Ajouter image (PNG, JPG, WebP)"
                folder={MEDIA_FOLDERS.wallpaper}
              />
            </div>
          </div>

          {/* Layer 2 */}
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Couche 2 — Avant (sur la vitre, sous le texte)
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-500">
                Vidéo alpha ou PNG (condensation, texture de vitre…). Toujours
                derrière le texte et la photo de profil.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { type: "none" as const, label: "Aucune" },
                  { type: "video" as const, label: "Vidéo alpha" },
                  { type: "image" as const, label: "Image PNG" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() =>
                    setFront({
                      type: opt.type,
                      url: opt.type === "none" ? null : front.url,
                      fallbackImageUrl:
                        opt.type === "video"
                          ? front.fallbackImageUrl ?? null
                          : null,
                    })
                  }
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                    front.type === opt.type
                      ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                      : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {front.type === "video" && (
              <>
                <VideoUpload
                  value={front.url}
                  onChange={(url) =>
                    setFront({
                      type: url ? "video" : "none",
                      url,
                      fallbackImageUrl: url
                        ? front.fallbackImageUrl ?? null
                        : null,
                    })
                  }
                  formats="webm-mp4"
                  compact
                  label="Upload vidéo alpha (WebM / MOV)"
                  folder={MEDIA_FOLDERS.wallpaper}
                />
                <div className="grid gap-1.5">
                  <p className="text-[10px] text-zinc-500">
                    Image de secours (si la vidéo ne charge pas)
                  </p>
                  <ImageUpload
                    value={front.fallbackImageUrl ?? null}
                    onChange={(url) => setFront({ fallbackImageUrl: url })}
                    aspectClassName="aspect-video max-h-28"
                    label="Image de secours"
                    folder={MEDIA_FOLDERS.wallpaper}
                  />
                </div>
              </>
            )}

            {front.type === "image" && (
              <ImageUpload
                value={front.url}
                onChange={(url) =>
                  setFront({
                    type: url ? "image" : "none",
                    url,
                    fallbackImageUrl: null,
                  })
                }
                aspectClassName="aspect-video max-h-36"
                label="Upload texture PNG / WebP"
                folder={MEDIA_FOLDERS.wallpaper}
              />
            )}

            {front.type !== "none" && front.url && (
              <div className="grid gap-1.5">
                <Label className="text-xs text-zinc-400">
                  Opacité couche avant : {Math.round(front.opacity * 100)}%
                </Label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={front.opacity}
                  onChange={(e) =>
                    setFront({ opacity: Number(e.target.value) })
                  }
                  className="w-full accent-teal-300"
                />
              </div>
            )}
          </div>

          {/* —— Global UI —— */}
          <div className="h-px bg-white/10" />

          <div className="grid gap-2">
            <Label htmlFor="overlay">
              Overlay sombre (fond site) : {Math.round(overlay * 100)}%
            </Label>
            <input
              id="overlay"
              type="range"
              min={0.3}
              max={0.7}
              step={0.02}
              value={overlay}
              onChange={(e) => setOverlay(Number(e.target.value))}
              className="w-full accent-teal-300"
            />
          </div>

          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
            )}
          >
            <input
              type="checkbox"
              checked={showDock}
              onChange={(e) => setShowDock(e.target.checked)}
              className="rounded border-white/20 accent-teal-300"
            />
            Afficher le Dock (desktop)
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 sm:w-auto"
            onClick={resetDefault}
          >
            <Link2 className="h-3.5 w-3.5" />
            Fond forêt par défaut uniquement
          </Button>
        </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/20 px-6 py-3">
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={apply}>Appliquer</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

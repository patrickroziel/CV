"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Film,
  Link2,
  Pencil,
  Play,
  Video,
} from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
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
import { EditGate } from "@/components/shared/EditGate";
import { VideoUpload } from "@/components/shared/VideoUpload";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type {
  FeatureVideo,
  FeatureVideoType,
  MainShowreel,
  Translatable,
} from "@/lib/types";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import {
  cn,
  isFileVideoUrl,
  isXUrl,
  isYoutubeUrl,
  xEmbedUrl,
  youtubeEmbedUrl,
  youtubeThumb,
} from "@/lib/utils";

type MediaSlot = {
  title: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
};

const VIDEO_TYPES: {
  type: FeatureVideoType;
  label: string;
  icon: typeof Film;
}[] = [
  { type: "none", label: "Aucune", icon: Film },
  { type: "youtube", label: "YouTube", icon: Video },
  { type: "x", label: "X", icon: Link2 },
  { type: "file", label: "Upload", icon: Film },
];

/** Detect natural aspect ratio of an uploaded video file */
function useVideoAspectRatio(
  videoType: FeatureVideoType,
  videoUrl: string | null
) {
  const [ratio, setRatio] = useState(16 / 9);

  useEffect(() => {
    if (videoType === "file" && videoUrl) {
      const el = document.createElement("video");
      el.preload = "metadata";
      el.src = videoUrl;
      const onMeta = () => {
        if (el.videoWidth > 0 && el.videoHeight > 0) {
          setRatio(el.videoWidth / el.videoHeight);
        } else {
          setRatio(16 / 9);
        }
      };
      el.addEventListener("loadedmetadata", onMeta);
      return () => {
        el.removeEventListener("loadedmetadata", onMeta);
        el.src = "";
      };
    }
    // YouTube / X / none → 16:9
    setRatio(16 / 9);
  }, [videoType, videoUrl]);

  return ratio;
}

function MediaPlayer({
  slot,
  autoplay = false,
  className,
}: {
  slot: MediaSlot;
  autoplay?: boolean;
  className?: string;
}) {
  const { videoType, videoUrl } = slot;
  const title = getL(slot.title);

  if (videoType === "none" || !videoUrl) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-900/80 to-black/80 text-zinc-500",
          className
        )}
      >
        <Play className="h-8 w-8 opacity-40" />
        <span className="text-xs">Aucune vidéo</span>
      </div>
    );
  }

  if (videoType === "youtube") {
    const thumb = youtubeThumb(videoUrl);
    const src = youtubeEmbedUrl(videoUrl, {
      autoplay,
      mute: autoplay,
      loop: autoplay,
      controls: true,
    });
    return (
      <div className={cn("relative h-full w-full bg-black", className)}>
        {src ? (
          <iframe
            key={src}
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>
    );
  }

  if (videoType === "x") {
    const src = xEmbedUrl(videoUrl);
    return (
      <div
        className={cn(
          "relative h-full w-full overflow-hidden bg-black",
          className
        )}
      >
        {src ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-zinc-500">
            𝕏
          </div>
        )}
      </div>
    );
  }

  if (videoType === "file" || isFileVideoUrl(videoUrl)) {
    return (
      <video
        src={videoUrl}
        className={cn("h-full w-full object-contain bg-black", className)}
        controls
        playsInline
        autoPlay={autoplay}
        muted={autoplay}
        loop={autoplay}
        preload="metadata"
        title={title}
      />
    );
  }

  return null;
}

function AdaptiveMediaFrame({
  slot,
  autoplay,
  className,
}: {
  slot: MediaSlot;
  autoplay?: boolean;
  className?: string;
}) {
  const ratio = useVideoAspectRatio(slot.videoType, slot.videoUrl);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-inner ring-1 ring-inset ring-white/5",
        className
      )}
      style={{ aspectRatio: String(ratio) }}
    >
      <MediaPlayer slot={slot} autoplay={autoplay} />
    </div>
  );
}

function cleanSlot(
  title: Translatable,
  videoType: FeatureVideoType,
  videoUrl: string | null,
  label: string
): { ok: true; slot: MediaSlot } | { ok: false; error: string } {
  let type = videoType;
  let url = videoUrl;

  if (type === "youtube") {
    const u = (url || "").trim();
    if (u && !isYoutubeUrl(u)) {
      return { ok: false, error: `« ${label} » : lien YouTube invalide.` };
    }
    if (!u) {
      type = "none";
      url = null;
    } else url = u;
  } else if (type === "x") {
    const u = (url || "").trim();
    if (u && !isXUrl(u)) {
      return { ok: false, error: `« ${label} » : lien X invalide.` };
    }
    if (!u) {
      type = "none";
      url = null;
    } else url = u;
  } else if (type === "file") {
    if (!url) {
      type = "none";
      url = null;
    }
  } else {
    type = "none";
    url = null;
  }

  return {
    ok: true,
    slot: {
      title: getL(title).trim() ? title : label,
      videoType: type,
      videoUrl: type === "none" ? null : url,
    },
  };
}

function SlotEditor({
  heading,
  title,
  videoType,
  videoUrl,
  onChange,
}: {
  heading: string;
  title: Translatable;
  videoType: FeatureVideoType;
  videoUrl: string | null;
  onChange: (partial: Partial<MediaSlot>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
        {heading}
      </p>
      <LocalizedField
        label="Titre"
        value={title}
        onChange={(next) => onChange({ title: next })}
        placeholder="Ex. Showreel, Motion design…"
      />
      <div className="grid gap-2">
        <Label>Type de média</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {VIDEO_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onChange({
                  videoType: type,
                  videoUrl:
                    type === "none"
                      ? null
                      : type === videoType
                        ? videoUrl
                        : type === "file"
                          ? videoType === "file"
                            ? videoUrl
                            : null
                          : type === "youtube" || type === "x"
                            ? videoType === type
                              ? videoUrl
                              : ""
                            : null,
                });
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10px] font-medium",
                videoType === type
                  ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                  : "border-white/10 bg-black/20 text-zinc-400"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {(videoType === "youtube" || videoType === "x") && (
        <div className="grid gap-2">
          <Label>
            {videoType === "youtube" ? "Lien YouTube" : "Lien X (post / vidéo)"}
          </Label>
          <Input
            value={videoUrl ?? ""}
            onChange={(e) => onChange({ videoUrl: e.target.value })}
            placeholder={
              videoType === "youtube"
                ? "https://youtu.be/…"
                : "https://x.com/…/status/…"
            }
          />
        </div>
      )}

      {videoType === "file" && (
        <VideoUpload
          value={
            videoUrl && isFileVideoUrl(videoUrl) ? videoUrl : null
          }
          onChange={(url) => onChange({ videoUrl: url })}
          label="Upload vidéo (max 4 Mo)"
        />
      )}
    </div>
  );
}

/**
 * Main showreel + 3 feature cards (same width column).
 * Main card supports title + YouTube / X / upload / none, adaptive ratio for files.
 */
export function ShowreelEmbed({ className }: { className?: string }) {
  const {
    data,
    updateMainShowreel,
    updateFeatureVideos,
    editMode,
    l,
  } = usePortfolio();

  const main = data.mainShowreel ?? {
    title: "Showreel",
    videoType: "youtube" as const,
    videoUrl: data.profile.showreelUrl || null,
  };
  const featureVideos = data.featureVideos ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [draftMain, setDraftMain] = useState<MainShowreel>(main);
  const [draftFeatures, setDraftFeatures] =
    useState<FeatureVideo[]>(featureVideos);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    setDraftMain({ ...main });
    setDraftFeatures(featureVideos.map((f) => ({ ...f })));
    setError(null);
    setEditOpen(true);
  };

  const handleSave = () => {
    setError(null);

    const mainResult = cleanSlot(
      draftMain.title,
      draftMain.videoType,
      draftMain.videoUrl,
      "Showreel"
    );
    if (!mainResult.ok) {
      setError(mainResult.error);
      return;
    }

    const cleanedFeatures: FeatureVideo[] = [];
    for (let i = 0; i < draftFeatures.length; i++) {
      const f = draftFeatures[i];
      const r = cleanSlot(
        f.title,
        f.videoType,
        f.videoUrl,
        getL(f.title) || `Carte ${i + 1}`
      );
      if (!r.ok) {
        setError(r.error);
        return;
      }
      cleanedFeatures.push({
        id: f.id,
        ...r.slot,
      });
    }

    updateMainShowreel(mainResult.slot);
    updateFeatureVideos(cleanedFeatures);
    setEditOpen(false);
  };

  const hasMain =
    main.videoType !== "none" && Boolean(main.videoUrl);
  const hasAnyFeature = featureVideos.some(
    (f) => f.videoType !== "none" && f.videoUrl
  );

  if (!hasMain && !hasAnyFeature && !editMode) {
    return null;
  }

  return (
    <>
      <motion.div
        id="showreel"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className={cn("w-full space-y-5 sm:space-y-6", className)}
      >
        {/* Main showreel card — full container width */}
        <GlassCard className="w-full overflow-hidden p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-300/25 bg-teal-300/15 text-teal-300">
                <Clapperboard className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Vidéo
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
                  {l(main.title)}
                </h2>
              </div>
            </div>
            <EditGate>
              <Button variant="secondary" size="sm" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier vidéos
              </Button>
            </EditGate>
          </div>

          {hasMain ? (
            <AdaptiveMediaFrame
              slot={main}
              autoplay={
                main.videoType === "youtube" || main.videoType === "file"
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-16 text-center">
              <p className="text-sm text-zinc-400">
                Aucune vidéo principale. Configurez-la en Mode Édition.
              </p>
              {editMode && (
                <Button size="sm" onClick={openEdit}>
                  Configurer les vidéos
                </Button>
              )}
            </div>
          )}
        </GlassCard>

        {/* 3 feature cards — same full width as main card above */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {featureVideos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
              className="min-w-0"
            >
              <GlassCard
                glow
                className="flex h-full w-full flex-col overflow-hidden p-0"
              >
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/10 bg-black">
                  <MediaPlayer slot={video} />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">
                    {l(video.title)}
                  </h3>
                  {video.videoType !== "none" && video.videoUrl && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                      {video.videoType === "youtube"
                        ? "YouTube"
                        : video.videoType === "x"
                          ? "X"
                          : video.videoType === "file"
                            ? "Upload"
                            : ""}
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Showreel & 3 cartes vidéo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5">
            <SlotEditor
              heading="Carte principale (Showreel)"
              title={draftMain.title}
              videoType={draftMain.videoType}
              videoUrl={draftMain.videoUrl}
              onChange={(partial) =>
                setDraftMain((m) => ({ ...m, ...partial }))
              }
            />

            <div className="h-px bg-white/10" />

            {draftFeatures.map((feat, index) => (
              <SlotEditor
                key={feat.id}
                heading={`Carte ${index + 1}`}
                title={feat.title}
                videoType={feat.videoType}
                videoUrl={feat.videoUrl}
                onChange={(partial) =>
                  setDraftFeatures((list) =>
                    list.map((f, i) =>
                      i === index ? { ...f, ...partial } : f
                    )
                  )
                }
              />
            ))}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

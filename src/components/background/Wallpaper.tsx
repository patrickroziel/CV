"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_BACKGROUND } from "@/lib/defaults";
import {
  normalizeBackgroundImages,
  pickRandomBackground,
} from "@/lib/storage";
import {
  DEFAULT_ALPHA_VIDEO_OPACITY,
  type BackgroundImage,
} from "@/lib/types";
import { universeFromPath } from "@/lib/universe";

function fallbackBackground(data: {
  backgroundImages?: BackgroundImage[];
  backgroundUrl?: string;
}): BackgroundImage {
  return (
    data.backgroundImages?.[0] ?? {
      id: "bg-fallback",
      url: data.backgroundUrl || DEFAULT_BACKGROUND,
      opacity: 1,
      alphaVideoUrl: null,
      alphaVideoEnabled: false,
      alphaVideoOpacity: DEFAULT_ALPHA_VIDEO_OPACITY,
    }
  );
}

const FADE_MS = 900;

/**
 * Work = user-managed wallpaper pool (restores the editable trees background).
 * Notes = fixed ocean/light background chosen for the Notes universe.
 */
export function Wallpaper() {
  const { data, isHydrated } = usePortfolio();
  const isNotes = universeFromPath(usePathname()) === "medias";
  const overlayOpacity = isHydrated ? data.ui.overlayOpacity : 0.52;
  const didPickRef = useRef(false);

  const poolKey = useMemo(() => {
    const images = data.backgroundImages ?? [];
    if (images.length > 0) {
      return images
        .map(
          (i) =>
            `${i.id}:${i.url}:${i.opacity ?? ""}:${i.alphaVideoUrl ?? ""}:${i.alphaVideoEnabled ? 1 : 0}:${i.alphaVideoOpacity ?? ""}`
        )
        .join("|");
    }
    return data.backgroundUrl || DEFAULT_BACKGROUND;
  }, [data.backgroundImages, data.backgroundUrl]);

  const [active, setActive] = useState<BackgroundImage>(() =>
    fallbackBackground(data)
  );
  const [prev, setPrev] = useState<BackgroundImage | null>(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [alphaFailed, setAlphaFailed] = useState(false);
  const [alphaVisible, setAlphaVisible] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const list = normalizeBackgroundImages(
      data.backgroundImages,
      data.backgroundUrl || DEFAULT_BACKGROUND
    );

    setActive((current) => {
      let next: BackgroundImage;
      if (isNotes) {
        next = {
          id: "bg-notes-ocean",
          url: "/notes-water-bg.png",
          opacity: 1,
          alphaVideoUrl: null,
          alphaVideoEnabled: false,
          alphaVideoOpacity: DEFAULT_ALPHA_VIDEO_OPACITY,
        };
      } else if (!didPickRef.current) {
        didPickRef.current = true;
        next = pickRandomBackground(list, data.backgroundUrl);
      } else {
        const still = list.find((img) => img.id === current.id);
        next = still ?? pickRandomBackground(list, data.backgroundUrl);
      }

      if (current.id !== next.id || current.url !== next.url) {
        setPrev(current);
        setFadeIn(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setFadeIn(true));
        });
        window.setTimeout(() => setPrev(null), FADE_MS + 80);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, poolKey, isNotes]);

  useEffect(() => {
    setAlphaFailed(false);
    setAlphaVisible(false);
  }, [active.alphaVideoUrl, active.id]);

  const showAlpha =
    Boolean(active.alphaVideoEnabled) &&
    Boolean(active.alphaVideoUrl?.trim()) &&
    !alphaFailed;

  const renderLayer = (
    img: BackgroundImage,
    opts: { visible: boolean; z: number; withAlpha: boolean }
  ) => {
    const op =
      typeof img.opacity === "number"
        ? Math.min(1, Math.max(0, img.opacity))
        : 1;
    const aOp =
      typeof img.alphaVideoOpacity === "number"
        ? Math.min(1, Math.max(0, img.alphaVideoOpacity))
        : DEFAULT_ALPHA_VIDEO_OPACITY;
    const alphaOn =
      opts.withAlpha &&
      Boolean(img.alphaVideoEnabled) &&
      Boolean(img.alphaVideoUrl?.trim());

    return (
      <div
        key={img.id + img.url}
        className="absolute inset-0 transition-opacity ease-in-out"
        style={{
          opacity: opts.visible ? 1 : 0,
          transitionDuration: `${FADE_MS}ms`,
          zIndex: opts.z,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt=""
          className="wallpaper-kenburns absolute inset-0 h-full w-full object-cover"
          style={{ opacity: op }}
          draggable={false}
        />
        {alphaOn && (
          <video
            src={img.alphaVideoUrl!}
            className="wallpaper-alpha-video absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{
              opacity: opts.withAlpha && alphaVisible ? aOp : 0,
              backgroundColor: "transparent",
              mixBlendMode: "normal",
            }}
            muted
            playsInline
            loop
            autoPlay
            preload="auto"
            onError={() => {
              if (opts.withAlpha) setAlphaFailed(true);
            }}
            onLoadedData={(e) => {
              void (e.currentTarget as HTMLVideoElement).play().catch(() => {});
              if (opts.withAlpha) setAlphaVisible(true);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {prev &&
        renderLayer(prev, {
          visible: !fadeIn,
          z: 0,
          withAlpha: false,
        })}
      {renderLayer(active, {
        visible: fadeIn,
        z: 1,
        withAlpha: showAlpha,
      })}

      <div
        className="absolute inset-0 z-[2]"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
      {isNotes ? (
        <>
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#02131a]/30 via-transparent to-[#01070a]/68" />
          <div
            className="absolute inset-0 z-[2]"
            style={{
              background:
                "radial-gradient(circle at 78% 16%, rgba(190,245,255,0.16), transparent 18%), radial-gradient(circle at 88% 8%, rgba(255,255,255,0.10), transparent 12%), radial-gradient(circle at 76% 56%, rgba(64,220,255,0.09), transparent 24%)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/30 via-transparent to-black/75" />
      )}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </div>
  );
}

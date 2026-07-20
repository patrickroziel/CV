"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, ProjectMediaType } from "@/lib/types";
import {
  cn,
  isYoutubeUrl,
  isXUrl,
  youtubeEmbedUrl,
  youtubeThumb,
} from "@/lib/utils";
import { XEmbed } from "@/components/projects/XEmbed";
import { usePortfolio } from "@/components/providers/PortfolioProvider";

type ProjectMediaProps = {
  project: Project;
  className?: string;
  /** Interactive player on detail page */
  interactive?: boolean;
};

function resolveMediaType(project: Project): ProjectMediaType {
  if (
    project.mediaType === "image" ||
    project.mediaType === "youtube" ||
    project.mediaType === "x"
  ) {
    return project.mediaType;
  }
  // Legacy / partial data
  if (project.videoUrl) {
    if (isXUrl(project.videoUrl)) return "x";
    if (isYoutubeUrl(project.videoUrl)) return "youtube";
  }
  return "image";
}

/**
 * Project cover media:
 * - image
 * - YouTube (autoplay muted loop in viewport)
 * - X post/video embed (loads in viewport)
 */
export function ProjectMedia({
  project,
  className,
  interactive = false,
}: ProjectMediaProps) {
  const { l } = usePortfolio();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const mediaType = resolveMediaType(project);
  const videoUrl = project.videoUrl;
  const title = l(project.title);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) =>
        setInView(entry.isIntersecting && entry.intersectionRatio > 0.3),
      { threshold: [0, 0.3, 0.55], rootMargin: "48px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // —— Image ——
  if (mediaType === "image" || !videoUrl) {
    return (
      <div ref={containerRef} className={cn("relative h-full w-full", className)}>
        {project.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5 text-zinc-600">
            {title.charAt(0)}
          </div>
        )}
      </div>
    );
  }

  // —— YouTube ——
  if (mediaType === "youtube") {
    if (interactive) {
      const src = youtubeEmbedUrl(videoUrl, {
        autoplay: false,
        mute: false,
        loop: false,
        controls: true,
      });
      return (
        <div
          ref={containerRef}
          className={cn("relative h-full w-full bg-black", className)}
        >
          {src && (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={src}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>
      );
    }

    const autoSrc = inView
      ? youtubeEmbedUrl(videoUrl, {
          autoplay: true,
          mute: true,
          loop: true,
          controls: false,
        })
      : null;
    const thumb = youtubeThumb(videoUrl) || project.image;

    return (
      <div
        ref={containerRef}
        className={cn("relative h-full w-full bg-black", className)}
      >
        {thumb && !autoSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {autoSrc && (
          <iframe
            className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02]"
            src={autoSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
          />
        )}
      </div>
    );
  }

  // —— X (Twitter) ——
  if (mediaType === "x") {
    return (
      <div
        ref={containerRef}
        className={cn("relative h-full w-full bg-black", className)}
      >
        <XEmbed
          url={videoUrl}
          title={title}
          interactive={interactive}
          active={interactive || inView}
          poster={project.image}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      <div className="flex h-full w-full items-center justify-center bg-white/5 text-zinc-600">
        {title.charAt(0)}
      </div>
    </div>
  );
}

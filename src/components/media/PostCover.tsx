"use client";

import { WorkInProgress } from "@/components/media/WorkInProgress";
import { isHeldMediaUrl } from "@/lib/blob-upload";
import { isWipCover, visibleCoverUrl } from "@/lib/post-publication";
import type { SocialPost } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PostCover({
  post,
  alt = "",
  className,
}: {
  post: Pick<SocialPost, "coverSource" | "bookCoverUrl">;
  alt?: string;
  className?: string;
}) {
  const frame = cn(
    "relative aspect-[16/8] w-full overflow-hidden bg-black/30 sm:aspect-[16/7]",
    className,
  );
  if (isWipCover(post)) {
    return (
      <div className={frame}>
        <WorkInProgress className="blob-wip--fill" />
      </div>
    );
  }
  const src = visibleCoverUrl(post);
  if (!src) return null;
  if (isHeldMediaUrl(src)) {
    return (
      <div className={frame}>
        <WorkInProgress className="blob-wip--fill" />
      </div>
    );
  }
  return (
    <div className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
    />
    </div>
  );
}

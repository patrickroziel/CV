"use client";
import type { InlinePostMedia } from "@/lib/types";
import { normalizeInlinePostMedia } from "@/lib/post-inline-media";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { RichHtml } from "@/components/shared/RichHtml";
import { extractRichSpacing, wrapWithRichSpacing } from "@/lib/rich-spacing";
import { looksLikeHtml } from "@/lib/sanitize-html";

type Segment = { html: string } | { mediaId: string };
const MEDIA_BLOCK = /<p>\s*\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]\s*<\/p>|\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]/g;

export function PostRichBody({ html, inlineMedia, title, className }: {
  html: string; inlineMedia?: InlinePostMedia[]; title: string; className?: string;
}) {
  const embeds = normalizeInlinePostMedia(inlineMedia);
  // No migration required for older published posts.
  if (!embeds.length || !html.includes("[[MEDIA:")) {
    return <RichHtml html={html} className={className} />;
  }
  const isMarkup = looksLikeHtml(html);
  const { body, lineHeight } = isMarkup ? extractRichSpacing(html) : { body: html, lineHeight: 1.6 };
  const segments: Segment[] = [];
  let end = 0;
  for (const match of body.matchAll(MEDIA_BLOCK)) {
    const start = match.index ?? 0;
    if (start > end) segments.push({ html: body.slice(end, start) });
    segments.push({ mediaId: match[1] ?? match[2] });
    end = start + match[0].length;
  }
  if (end < body.length) segments.push({ html: body.slice(end) });
  if (!segments.some(segment => "mediaId" in segment)) {
    return <RichHtml html={html} className={className} />;
  }
  return <div className="min-w-0 space-y-5">
    {segments.map((segment, i) => {
      if ("mediaId" in segment) {
        const item = embeds.find(media => media.id === segment.mediaId);
        return item ? <div key={i} className="min-w-0"><FeaturedMedia media={item} title={title} /></div> : null;
      }
      if (!segment.html.trim()) return null;
      const part = isMarkup ? wrapWithRichSpacing(segment.html, lineHeight) : segment.html;
      return <RichHtml key={i} html={part} className={className} />;
    })}
  </div>;
}

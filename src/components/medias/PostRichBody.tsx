"use client";
import type { InlinePostMedia } from "@/lib/types";
import { normalizeInlinePostMedia } from "@/lib/post-inline-media";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { RichHtml } from "@/components/shared/RichHtml";
import { DEFAULT_LINE_HEIGHT, extractRichSpacing, wrapWithRichSpacing } from "@/lib/rich-spacing";
import { looksLikeHtml } from "@/lib/sanitize-html";

type Segment = { html: string } | { mediaId: string };
const MEDIA_BLOCK = /<p>\s*\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]\s*<\/p>|\[\[MEDIA:([a-zA-Z0-9_-]{8,80})\]\]/g;

export function PostRichBody({ html, inlineMedia, title, className }: {
  html: string; inlineMedia?: InlinePostMedia[]; title: string; className?: string;
}) {
  const embeds = normalizeInlinePostMedia(inlineMedia);
  // Existing posts without inline media remain unchanged.
  if (!embeds.length) return <RichHtml html={html} className={className} />;
  const isMarkup = looksLikeHtml(html);
  const { body, lineHeight } = isMarkup ? extractRichSpacing(html) : { body: html, lineHeight: DEFAULT_LINE_HEIGHT };
  const segments: Segment[] = [];
  const located = new Set<string>();
  let end = 0;
  for (const match of body.matchAll(MEDIA_BLOCK)) {
    const start = match.index ?? 0;
    if (start > end) segments.push({ html: body.slice(end, start) });
    const id = match[1] ?? match[2];
    segments.push({ mediaId: id });
    located.add(id);
    end = start + match[0].length;
  }
  if (end < body.length) segments.push({ html: body.slice(end) });
  // The former editor (Oct 19) sometimes saved the media in inlineMedia but
  // rejected its position marker. Render these orphaned assets after the text,
  // rather than silently losing existing videos or photos.
  const unplaced = embeds.filter(media => !located.has(media.id));
  if (!located.size) {
    return <div className="min-w-0 space-y-5">
      <RichHtml html={html} className={className} />
      {unplaced.map(media => <div key={media.id} className="min-w-0">
        <FeaturedMedia media={media} title={title} />
      </div>)}
    </div>;
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
    {unplaced.map(media => <div key={media.id} className="min-w-0">
      <FeaturedMedia media={media} title={title} />
    </div>)}
  </div>;
}

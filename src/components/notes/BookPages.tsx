"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PostInlineMediaView } from "@/components/medias/PostRichBody";
import { RichHtml } from "@/components/shared/RichHtml";
import { bookBlocks, type BookBlock } from "@/lib/book-blocks";
import { normalizeInlinePostMedia } from "@/lib/post-inline-media";
import type { InlinePostMedia } from "@/lib/types";

function explode(blocks: BookBlock[]): BookBlock[] {
  if (typeof document === "undefined") return blocks;
  const fine: BookBlock[] = [];
  for (const block of blocks) {
    if (block.type === "media") {
      fine.push(block);
      continue;
    }
    const template = document.createElement("template");
    template.innerHTML = block.html;
    const nodes = Array.from(template.content.childNodes);
    let kept = 0;
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent || "").replace(/\u00a0/g, " ").trim();
        if (!text) continue;
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        fine.push({ type: "html", html: paragraph.outerHTML });
        kept += 1;
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const element = node as HTMLElement;
      const text = (element.textContent || "").replace(/\u00a0/g, " ").trim();
      if (!text && !element.querySelector("img, video, iframe, br")) continue;
      fine.push({ type: "html", html: element.outerHTML });
      kept += 1;
    }
    if (!kept && block.html.trim()) fine.push(block);
  }
  return fine;
}

export function BookPages({
  title,
  subtitle,
  html,
  inlineMedia,
  titleId,
}: {
  title: string;
  subtitle: string;
  html: string;
  inlineMedia?: InlinePostMedia[];
  titleId?: string;
}) {
  const media = useMemo(() => normalizeInlinePostMedia(inlineMedia), [inlineMedia]);
  const blocks = useMemo(
    () => bookBlocks(html, media.map((item) => item.id)),
    [html, media],
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);
  const [pages, setPages] = useState<BookBlock[][]>([blocks]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const read = () => setSize({ w: frame.clientWidth, h: frame.clientHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!size.w || !size.h) return;
    const probe = document.createElement("div");
    probe.className = "book-ink";
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${size.w}px;`;
    document.body.appendChild(probe);
    const next: BookBlock[][] = [];
    let bucket: BookBlock[] = [];
    const heightOf = (items: BookBlock[]) => {
      probe.innerHTML = items
        .filter((item): item is { type: "html"; html: string } => item.type === "html")
        .map((item) => item.html)
        .join("");
      return probe.scrollHeight;
    };
    const pieces = explode(blocks);
    for (const block of pieces) {
      if (block.type === "media") {
        if (bucket.length) next.push(bucket);
        next.push([block]);
        bucket = [];
        continue;
      }
      const trial = [...bucket, block];
      if (bucket.length && heightOf(trial) > size.h) {
        next.push(bucket);
        bucket = [block];
      } else {
        bucket = trial;
      }
    }
    if (bucket.length) next.push(bucket);
    probe.remove();
    const ready = next.length ? next : [[]];
    setPages(ready);
    setPage((current) => Math.min(current, ready.length - 1));
  }, [blocks, size.h, size.w]);

  useEffect(() => {
    setPage(0);
  }, [html]);

  const total = Math.max(pages.length, 1);
  const index = Math.min(page, total - 1);
  const current = pages[index] ?? [];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowRight") setPage((value) => Math.min(total - 1, value + 1));
      if (event.key === "ArrowLeft") setPage((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <article
      className="book-sheet mx-auto flex w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.25rem] bg-[#f4efe6] text-[#1c1612] shadow-[0_28px_70px_rgba(0,0,0,0.4)]"
      style={{ fontFamily: "var(--font-book), Georgia, 'Times New Roman', serif", height: "min(78dvh, 820px)" }}
      onTouchStart={(event) => {
        touchX.current = event.changedTouches[0]?.clientX ?? 0;
      }}
      onTouchEnd={(event) => {
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (delta > 48) setPage((value) => Math.max(0, value - 1));
        if (delta < -48) setPage((value) => Math.min(total - 1, value + 1));
      }}
    >
      <header className="shrink-0 px-6 pt-6 sm:px-10 sm:pt-8">
        {index === 0 ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a8175]">Livre</p>
            <h1 id={titleId} className="mt-2 text-[1.7rem] font-bold leading-tight sm:text-[2rem]">{title}</h1>
            {subtitle ? <p className="mt-3 text-[1.02rem] italic leading-7 text-[#5c564c]">{subtitle}</p> : null}
          </>
        ) : (
          <p className="truncate text-center text-[11px] uppercase tracking-[0.18em] text-[#8a8175]">{title}</p>
        )}
      </header>
      <div ref={frameRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-10">
        {current.map((block, blockIndex) => {
          if (block.type === "media") {
            const item = media.find((entry) => entry.id === block.id);
            return item ? (
              <div key={block.id} className="my-1">
                <PostInlineMediaView item={item} title={title} />
              </div>
            ) : null;
          }
          return <RichHtml key={blockIndex} html={block.html} className="book-ink" />;
        })}
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e4d8c6] px-3 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(0, value - 1))}
          disabled={index === 0}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-3 text-sm text-[#5c5348] disabled:cursor-default disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>
        <span className="text-sm tabular-nums tracking-[0.22em] text-[#5c5348]" aria-live="polite">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(total - 1, value + 1))}
          disabled={index >= total - 1}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full px-3 text-sm text-[#5c5348] disabled:cursor-default disabled:opacity-30"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </article>
  );
}

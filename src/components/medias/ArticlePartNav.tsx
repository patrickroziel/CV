"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Part = { id: string; label: string; n: number };

export function notePartAnchor(postId: string, index: number) {
  return `part-${index}-note-body-${postId}`;
}

export function stampNotePartAnchors(html: string, postId: string) {
  let index = 0;
  return html.replace(/<h2\b([^>]*\bair-part-title\b[^>]*)>/gi, (_full, attrs: string) => {
    const id = notePartAnchor(postId, index);
    index += 1;
    if (/\sid\s*=/i.test(attrs)) return `<h2${attrs}>`;
    return `<h2 id="${id}"${attrs}>`;
  });
}

export function notePartTitles(html: string) {
  const titles: { label: string; index: number }[] = [];
  const pattern = /<h2\b[^>]*\bair-part-title\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let index = 0;
  for (const match of html.matchAll(pattern)) {
    const text = (match[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text && text.toLocaleLowerCase("fr") !== "titre de la partie") titles.push({ label: text, index });
    index += 1;
  }
  return titles;
}

export function ArticlePartNav({ targetId, tone = "air" }: { targetId: string; tone?: "air" | "notes" }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2.air-part-title"));
    heads.forEach((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
      el.classList.remove("air-part-held");
    });
    const next = heads
      .map((el, index) => ({
        id: el.id,
        n: index + 1,
        label: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((part) => part.label && part.label.toLocaleLowerCase("fr") !== "titre de la partie");
    setParts(next);
    const mark = () => {
      const line = 110;
      let current = next[0]?.id ?? null;
      for (const part of next) {
        const el = document.getElementById(part.id);
        if (el && el.getBoundingClientRect().top <= line) current = part.id;
      }
      setCurrentId(current);
    };
    mark();
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
      document.querySelectorAll(".air-part-morph").forEach((node) => node.remove());
    };
  }, [targetId]);

  if (!parts.length) return null;

  return (
    <div className={tone === "notes" ? "notes-part-stack" : "air-part-stack"}>
      {parts.map((part) => (
        <a
          key={part.id}
          href={`#${part.id}`}
          title={`Partie ${part.n}. ${part.label}`}
          aria-current={part.id === currentId ? "true" : undefined}
          className={["air-part-float", tone === "notes" ? "is-notes" : "", part.id === currentId ? "is-current" : ""].filter(Boolean).join(" ")}
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(part.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <span className="air-part-num">{part.n}</span>
          <span className="air-part-name">{part.label}</span>
        </a>
      ))}
    </div>
  );
}

export function ReadingTitle({ anchorId, title, subtitle = "", targetId, tone = "air" }: { anchorId: string; title: string; subtitle?: string; targetId: string; tone?: "air" | "notes" }) {
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onScroll = () => {
      const titleEl = document.getElementById(anchorId);
      const article = titleEl?.closest("article");
      if (!titleEl || !(article instanceof HTMLElement)) return;
      const titleGone = titleEl.getBoundingClientRect().bottom < 72;
      const stillInArticle = article.getBoundingClientRect().bottom > 180;
      setShown(titleGone && stillInArticle);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [anchorId]);
  if (!mounted || !shown || !title.trim()) return null;
  return createPortal(
    <div className="reading-title">
      <div className="reading-pill">
        <p className="reading-title-main">{title}</p>
        {subtitle.trim() ? <p className="reading-title-sub">{subtitle.trim()}</p> : null}
      </div>
      <ArticlePartNav targetId={targetId} tone={tone} />
    </div>,
    document.body,
  );
}

export function NotesFloatingStack({ postId, title = "", subtitle = "" }: { postId: string; title?: string; subtitle?: string }) {
  return (
    <div className="notes-read-head">
      <ReadingTitle anchorId={`note-title-${postId}`} title={title} subtitle={subtitle} targetId={`note-body-${postId}`} tone="notes" />
      <ArticlePartNav targetId={`note-body-${postId}`} tone="notes" />
    </div>
  );
}

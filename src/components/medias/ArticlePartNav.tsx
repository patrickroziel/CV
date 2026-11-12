"use client";

import { useEffect, useState, type MouseEvent } from "react";
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
  const [openedId, setOpenedId] = useState<string | null>(null);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2.air-part-title"));
    heads.forEach((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
    });
    const next = heads
      .map((el, index) => ({
        id: el.id,
        n: index + 1,
        label: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((part) => part.label && part.label.toLocaleLowerCase("fr") !== "titre de la partie");
    const pick = () => {
      const bar = document.querySelector(".reading-title");
      const line = bar instanceof HTMLElement ? bar.getBoundingClientRect().bottom + 6 : 110;
      const passed = next.filter((part) => {
        const el = document.getElementById(part.id);
        return el ? el.getBoundingClientRect().top < line : false;
      });
      setParts((current) => {
        if (current.length === passed.length && current.every((part, index) => part.id === passed[index]?.id)) return current;
        return passed;
      });
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [targetId]);

  const current = parts[parts.length - 1];
  if (!current) return null;
  const earlier = parts.slice(0, -1);
  const opened = earlier.find((part) => part.id === openedId) ?? null;
  const jump = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={tone === "notes" ? "notes-part-stack" : "air-part-stack"}>
      {earlier.length ? (
        <div className="air-part-nums">
          {earlier.map((part) => (
            <button
              key={part.id}
              type="button"
              className="air-part-dot"
              aria-expanded={opened?.id === part.id}
              title={`Partie ${part.n}. ${part.label}`}
              onClick={() => setOpenedId((id) => (id === part.id ? null : part.id))}
            >
              {part.n}
            </button>
          ))}
        </div>
      ) : null}
      {opened ? (
        <p className={["air-part-float", tone === "notes" ? "is-notes" : ""].filter(Boolean).join(" ")}>
          <span className="air-part-num">{opened.n}</span>
          <span className="air-part-name">{opened.label}</span>
        </p>
      ) : null}
      <a
        href={`#${current.id}`}
        title={`Partie ${current.n}. ${current.label}`}
        className={["air-part-float", tone === "notes" ? "is-notes" : ""].filter(Boolean).join(" ")}
        onClick={jump(current.id)}
      >
        <span className="air-part-num">{current.n}</span>
        <span className="air-part-name">{current.label}</span>
      </a>
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
  return <ReadingTitle anchorId={`note-title-${postId}`} title={title} subtitle={subtitle} targetId={`note-body-${postId}`} tone="notes" />;
}

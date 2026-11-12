"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Part = { id: string; label: string; n: number };
type Flight = { id: string; from: DOMRect; to?: DOMRect; label: string; n: number; towardChip: boolean };

function flyMorph(from: DOMRect, to: DOMRect, label: string, n: number, towardChip: boolean, notes: boolean, onDone: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to.width < 2) {
    onDone();
    return () => {};
  }
  const el = document.createElement("div");
  el.className = `${towardChip ? "air-part-morph" : "air-part-morph is-compact"}${notes ? " is-notes" : ""}`;
  const num = document.createElement("span");
  num.className = "air-part-num";
  num.textContent = String(n);
  const name = document.createElement("span");
  name.className = "air-part-name";
  name.textContent = label;
  el.append(num, name);
  const place = (rect: DOMRect) => {
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${Math.max(rect.width, 8)}px`;
    el.style.height = `${Math.max(rect.height, 8)}px`;
  };
  place(from);
  document.body.appendChild(el);
  let stopped = false;
  const finish = () => {
    if (stopped) return;
    stopped = true;
    el.remove();
    onDone();
  };
  const start = window.setTimeout(() => {
    el.classList.toggle("is-compact", towardChip);
    if (notes) el.classList.add("is-notes");
    place(to);
  }, 24);
  const end = window.setTimeout(finish, 520);
  return () => {
    stopped = true;
    window.clearTimeout(start);
    window.clearTimeout(end);
    el.remove();
  };
}

function expandedRect(el: HTMLElement) {
  const previous = el.style.transition;
  el.style.transition = "none";
  el.classList.remove("air-part-held");
  const rect = el.getBoundingClientRect();
  el.classList.add("air-part-held");
  void el.offsetHeight;
  el.style.transition = previous;
  return rect;
}

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
  const [arriving, setArriving] = useState<string[]>([]);
  const [landed, setLanded] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const chipRefs = useRef(new Map<string, HTMLAnchorElement>());
  const prevIds = useRef<string[]>([]);
  const pending = useRef<Flight | null>(null);
  const cancelFlight = useRef<(() => void) | null>(null);
  const flying = useRef(false);
  const openRef = useRef(false);
  const openedAt = useRef<number | null>(null);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2.air-part-title"));
    heads.forEach((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
    });
    if (!heads.length) return;

    const publish = (stuck: HTMLElement[]) => {
      prevIds.current = stuck.map((el) => el.id);
      setParts(stuck.map((el) => ({
        id: el.id,
        n: heads.indexOf(el) + 1,
        label: (el.textContent || "").replace(/\s+/g, " ").trim(),
      })));
    };

    let primed = false;
    const pick = () => {
      const title = root.closest("article")?.querySelector(".notes-title-pill, .air-title-pill");
      const line = title ? title.getBoundingClientRect().bottom : 160;
      const stuck = heads.filter((el) => el.getBoundingClientRect().top < line - 8);
      const nextIds = stuck.map((el) => el.id);
      const same = nextIds.length === prevIds.current.length && nextIds.every((id, index) => id === prevIds.current[index]);
      if (same && primed) return;

      const added = nextIds.filter((id) => !prevIds.current.includes(id));
      const removed = prevIds.current.filter((id) => !nextIds.includes(id));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const calm = primed && !flying.current && !reduce && added.length + removed.length === 1;

      if (!calm) {
        cancelFlight.current?.();
        cancelFlight.current = null;
        flying.current = false;
        pending.current = null;
        heads.forEach((el) => el.classList.toggle("air-part-held", nextIds.includes(el.id)));
        setArriving([]);
        primed = true;
        publish(stuck);
        return;
      }

      if (added.length === 1) {
        const el = heads.find((head) => head.id === added[0]);
        if (!el) return;
        pending.current = {
          id: el.id,
          from: el.getBoundingClientRect(),
          label: (el.textContent || "").replace(/\s+/g, " ").trim(),
          n: heads.indexOf(el) + 1,
          towardChip: true,
        };
        flying.current = true;
        setArriving([el.id]);
      } else {
        const el = heads.find((head) => head.id === removed[0]);
        const chip = el ? chipRefs.current.get(el.id) : undefined;
        if (!el || !chip) {
          heads.forEach((head) => head.classList.toggle("air-part-held", nextIds.includes(head.id)));
          primed = true;
          publish(stuck);
          return;
        }
        pending.current = {
          id: el.id,
          from: chip.getBoundingClientRect(),
          to: expandedRect(el),
          label: (el.textContent || "").replace(/\s+/g, " ").trim(),
          n: heads.indexOf(el) + 1,
          towardChip: false,
        };
        flying.current = true;
        el.classList.add("air-part-held");
      }
      publish(stuck);
    };

    pick();
    const onScroll = () => {
      const y = window.scrollY;
      if (openRef.current && openedAt.current != null && y < openedAt.current - 24) {
        openedAt.current = null;
        openRef.current = false;
        setOpen(false);
      }
      pick();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      cancelFlight.current?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", pick);
      document.querySelectorAll(".air-part-morph").forEach((node) => node.remove());
    };
  }, [targetId]);

  useEffect(() => {
    openRef.current = false;
    openedAt.current = null;
    setOpen(false);
  }, [targetId]);

  useLayoutEffect(() => {
    const flight = pending.current;
    if (!flight) return;
    pending.current = null;
    const chip = chipRefs.current.get(flight.id);
    const to = flight.towardChip ? chip?.getBoundingClientRect() : flight.to;
    if (!to) {
      flying.current = false;
      setArriving([]);
      return;
    }
    if (flight.towardChip) document.getElementById(flight.id)?.classList.add("air-part-held");
    cancelFlight.current = flyMorph(flight.from, to, flight.label, flight.n, flight.towardChip, tone === "notes", () => {
      cancelFlight.current = null;
      flying.current = false;
      const el = document.getElementById(flight.id);
      if (flight.towardChip) {
        el?.classList.add("air-part-held");
        setArriving((current) => current.filter((id) => id !== flight.id));
        setLanded(flight.id);
        window.setTimeout(() => setLanded((current) => (current === flight.id ? null : current)), 700);
        return;
      }
      if (el) {
        el.style.transition = "none";
        el.classList.remove("air-part-held");
        void el.offsetHeight;
        el.style.transition = "";
      }
    });
  }, [parts]);

  if (!parts.length) return null;

  const overflow = parts.length > 3 && !open;
  const visible = overflow ? parts.slice(0, 2) : parts;
  const hidden = overflow ? parts.slice(2) : [];
  const currentId = parts[parts.length - 1]?.id;

  const pill = (part: Part) => (
    <a
      key={part.id}
      href={`#${part.id}`}
      title={`Partie ${part.n}. ${part.label}`}
      aria-current={part.id === currentId ? "true" : undefined}
      className={[
        "air-part-float",
        tone === "notes" ? "is-notes" : "",
        part.id === currentId ? "is-current" : "",
        arriving.includes(part.id) ? "is-arriving" : "",
        landed === part.id ? "is-landed" : "",
      ].filter(Boolean).join(" ")}
      ref={(node) => {
        if (node) chipRefs.current.set(part.id, node);
        else chipRefs.current.delete(part.id);
      }}
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(part.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      <span className="air-part-num">{part.n}</span>
      <span className="air-part-name">{part.label}</span>
    </a>
  );

  return (
    <div className={tone === "notes" ? "notes-part-stack" : "air-part-stack"}>
      {visible.map(pill)}
      {overflow ? (
        <button
          type="button"
          className="air-part-more"
          aria-expanded={false}
          aria-label="Afficher les parties masquées"
          onClick={() => {
            openedAt.current = window.scrollY;
            openRef.current = true;
            setOpen(true);
          }}
        >
          {hidden.map((part) => (
            <span key={part.id} className="air-part-num">{part.n}</span>
          ))}
        </button>
      ) : null}
    </div>
  );
}

export function NotesFloatingStack({ postId, title, subtitle = "" }: { postId: string; title: string; subtitle?: string }) {
  const [raised, setRaised] = useState(false);
  useEffect(() => {
    const titleEl = document.getElementById(`note-title-${postId}`);
    const onScroll = () => {
      if (!titleEl) return;
      setRaised(titleEl.getBoundingClientRect().bottom < 78);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [postId]);
  return (
    <div className="notes-read-head">
      {raised ? (
        <a href={`#note-title-${postId}`} className="notes-title-pill" onClick={(event) => {
          event.preventDefault();
          document.getElementById(`note-title-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}>
          <span className="notes-title-copy">
            <span className="notes-title-main">{title}</span>
            {subtitle.trim() ? <span className="notes-title-sub">{subtitle.trim()}</span> : null}
          </span>
        </a>
      ) : null}
      <ArticlePartNav targetId={`note-body-${postId}`} tone="notes" />
    </div>
  );
}

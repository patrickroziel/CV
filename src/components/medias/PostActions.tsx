"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { SITE_LANGUAGE_CODES, SITE_LANGUAGE_STORAGE_KEY } from "@/lib/site-translation";

type ResponseState = { available?: boolean; count?: number; liked?: boolean };
type PublicComment = { id: string; name: string; body: string; createdAt: string };
type ShareTarget = "x" | "facebook" | "instagram" | "youtube" | "whatsapp" | "linkedin" | "telegram" | "threads" | "bluesky" | "pinterest" | "email" | "copy" | "more";

const pendingLikes = new Map<string, Array<(state: ResponseState) => void>>();
let likeFlush: ReturnType<typeof setTimeout> | null = null;

function loadLike(postId: string): Promise<ResponseState> {
  return new Promise((resolve) => {
    const waiters = pendingLikes.get(postId) ?? [];
    waiters.push(resolve);
    pendingLikes.set(postId, waiters);
    if (likeFlush) return;
    likeFlush = setTimeout(() => {
      likeFlush = null;
      const batch = new Map(pendingLikes);
      pendingLikes.clear();
      const ids = [...batch.keys()];
      const finish = (posts: Record<string, ResponseState>) => {
        for (const [id, waiters] of batch) {
          const state = posts[id] ?? { available: false, count: 0, liked: false };
          for (const waiter of waiters) waiter(state);
        }
      };
      fetch(`/api/notes/likes?ids=${encodeURIComponent(ids.join(","))}`, { cache: "no-store" })
        .then((res) => res.ok ? res.json() as Promise<{ posts?: Record<string, ResponseState> }> : Promise.reject())
        .then((body) => finish(body.posts ?? {}))
        .catch(() => finish({}));
    }, 40);
  });
}

const SHARE_MENU: { id: ShareTarget; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X (Twitter)" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "threads", label: "Threads" },
  { id: "email", label: "Email" },
  { id: "copy", label: "Copier le lien" },
];

function selectedLanguage() {
  const raw = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
  const lang = raw === "en" || raw === "en-GB" ? "en-US" : raw;
  return lang && lang !== "fr" && SITE_LANGUAGE_CODES.has(lang) ? lang : null;
}

function articleShareUrl(sharePath: string, postId: string) {
  const url = new URL(`${sharePath}/${encodeURIComponent(postId)}`, "https://patrickroziel.com");
  const lang = selectedLanguage();
  if (lang) url.searchParams.set("lang", lang);
  return url.toString();
}

function openPopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=720,height=760");
}

async function shareLink(target: ShareTarget, options: { url: string; title: string; summary?: string; onMessage: (message: string) => void }) {
  const url = options.url;
  const headline = options.title.trim() || "Patrick Roziel";
  const excerpt = (options.summary || "").trim();
  const text = [excerpt, url].filter(Boolean).join("\n");
  const say = options.onMessage;
  say("");
  try {
    if (target === "copy" || target === "instagram") {
      await navigator.clipboard.writeText(url);
      say(target === "instagram" ? "Lien copié. Colle-le dans Instagram." : "Lien copié.");
      return;
    }
    if (target === "more") {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: headline, text: excerpt || headline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say("Lien copié.");
      return;
    }
    if (target === "email") {
      window.location.href = `mailto:?subject=${encodeURIComponent(headline)}&body=${encodeURIComponent(text)}`;
      return;
    }
    const encodedUrl = encodeURIComponent(url);
    const encodedMessage = encodeURIComponent(text);
    const encodedExcerpt = encodeURIComponent(excerpt);
    const hrefs: Partial<Record<ShareTarget, string>> = {
      x: `https://twitter.com/intent/tweet?text=${encodedExcerpt}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedExcerpt}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodedMessage}`,
      threads: `https://www.threads.net/intent/post?text=${encodedMessage}`,
    };
    const href = hrefs[target];
    if (href) openPopup(href);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      say("Lien copié.");
    } catch {
      say("Impossible de partager pour le moment.");
    }
  }
}

export function ShareButton({ postId = "", sharePath = "", url = "", title, summary = "", dock = false }: {
  postId?: string; sharePath?: string; url?: string; title: string; summary?: string; dock?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [spot, setSpot] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(window.innerWidth - 112, Math.max(112, rect.left + rect.width / 2));
    const up = dock || window.innerHeight - rect.bottom < 320;
    setSpot({ top: up ? rect.top : rect.bottom, left, up });
  }

  useEffect(() => {
    if (!open) return;
    place();
    const onPointer = (event: PointerEvent) => {
      const node = event.target as Node;
      if (buttonRef.current?.contains(node)) return;
      const element = event.target instanceof Element ? event.target : null;
      if (element?.closest("[data-share-menu]")) return;
      setOpen(false);
    };
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, dock]);

  function currentUrl() {
    return url || articleShareUrl(sharePath || "/notes", postId);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={dock ? `dock-icon${open ? " is-on" : ""}` : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white"}
        aria-label="Partager"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Share2 className={dock ? undefined : "h-3.5 w-3.5"} aria-hidden />
      </button>
      {open && spot ? createPortal(
        <div
          data-share-menu="true"
          data-no-translate="true"
          className="fixed z-[80] w-52 -translate-x-1/2 rounded-2xl border border-white/15 bg-[#071018]/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          style={spot.up ? { left: spot.left, bottom: window.innerHeight - spot.top + 8 } : { left: spot.left, top: spot.top + 8 }}
        >
          {SHARE_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium text-white hover:bg-white/10"
              onClick={() => {
                void shareLink(item.id, { url: currentUrl(), title, summary, onMessage: setMessage });
                if (item.id !== "copy" && item.id !== "instagram") setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
          {message ? <p role="status" className="px-3 py-1.5 text-[11px] leading-snug text-cyan-100">{message}</p> : null}
        </div>,
        document.body,
      ) : null}
    </>
  );
}

export function DockShare({ postId, sharePath, title, summary = "" }: { postId: string; sharePath: string; title: string; summary?: string }) {
  return <ShareButton dock postId={postId} sharePath={sharePath} title={title} summary={summary} />;
}

function CommentThread({ postId, tone, open, onSent }: { postId: string; tone: "dark" | "light"; open: boolean; onSent: () => void }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const quiet = tone === "light" ? "text-[#1c1917]/55" : "text-cyan-100/55";
  const text = tone === "light" ? "text-[#1c1917]/80" : "text-cyan-50";
  const field = tone === "light"
    ? "border-[#1c1917]/15 bg-white/40 text-[#1c1917] placeholder:text-[#1c1917]/35"
    : "border-cyan-100/20 bg-[#031c25]/40 text-cyan-50 placeholder:text-cyan-100/35";

  useEffect(() => {
    let active = true;
    fetch(`/api/notes/${encodeURIComponent(postId)}/comments`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ comments?: PublicComment[] }> : { comments: [] })
      .then((result) => { if (active) setComments(result.comments ?? []); })
      .catch(() => { if (active) setComments([]); });
    return () => { active = false; };
  }, [postId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trap = String(new FormData(event.currentTarget).get("website") || website);
    setSending(true);
    setNote("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, body, website: trap }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Envoi impossible.");
      setBody("");
      setNote("Message reçu. Il sera visible après validation.");
      onSent();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  if (!open && comments.length === 0 && !note) return null;

  return <div className="max-w-xl">
    {comments.length > 0 && <ul className="mb-2 space-y-1.5">
      {comments.map((comment) => (
        <li key={comment.id} className={`text-xs leading-5 ${text}`}>
          <span className="font-medium">{comment.name}</span>
          <span className={quiet}> — {comment.body}</span>
        </li>
      ))}
    </ul>}
    {open && (
      <form className="space-y-2" onSubmit={(event) => void send(event)}>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required placeholder="Prénom ou pseudo" aria-label="Prénom ou pseudo"
          className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none ${field}`} />
        <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={800} required rows={3} placeholder="Ton message" aria-label="Message"
          className={`w-full resize-y rounded-lg border px-2.5 py-1.5 text-xs outline-none ${field}`} />
        <input name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <button type="submit" disabled={sending} className={`text-[13px] font-medium underline-offset-2 hover:underline disabled:opacity-50 ${text}`}>
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    )}
    {note && <p role="status" className={`text-[11px] ${text}`}>{note}</p>}
  </div>;
}

export function PostActions({ postId, title, summary = "", visible = true, sharePath = "/notes", tone = "dark", comments = false, floating = false, dock = false, card = false, commentLink = "", shareOnly = false }: {
  postId: string; title: string; summary?: string; visible?: boolean; sharePath?: string; tone?: "dark" | "light"; comments?: boolean; floating?: boolean; dock?: boolean; card?: boolean; commentLink?: string; shareOnly?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    if (!visible || shareOnly) return;
    setEnabled(false);
    setCount(0);
    setLiked(false);
    loadLike(postId)
      .then(state => {
        if (!active) return;
        setEnabled(state.available === true);
        setCount(Math.max(0, Number(state.count) || 0));
        setLiked(state.liked === true);
      })
      .catch(() => { if (active) setEnabled(false); });
    return () => { active = false; };
  }, [postId, visible, shareOnly]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!comments) return;
    const onOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== postId) return;
      setCommentOpen(true);
      window.setTimeout(() => {
        document.getElementById(`post-comments-${postId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    };
    window.addEventListener("article-comments", onOpen);
    if (window.location.hash === "#commenter") onOpen(new CustomEvent("article-comments", { detail: postId }));
    return () => window.removeEventListener("article-comments", onOpen);
  }, [comments, postId]);

  if (!visible) return null;

  async function react() {
    if (!enabled || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !liked }),
      });
      if (!response.ok) throw new Error();
      const state = await response.json() as ResponseState;
      setLiked(state.liked === true); setCount(Number(state.count) || 0);
    } catch { setMessage("Like indisponible."); }
    finally { setBusy(false); }
  }

  const reactionClass = tone === "light"
    ? "text-[#1c1917]/80 hover:text-[#1c1917]"
    : sharePath === "/air"
      ? "text-white/80 hover:text-white"
      : "text-cyan-100 hover:text-white";
  const reactions = (
    <div className={floating ? "article-actions-float" : "flex items-center gap-3"}>
      <button type="button" onClick={() => void react()} disabled={!enabled || busy}
        aria-pressed={liked} aria-label={liked ? "Retirer mon like" : "J'aime"}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition disabled:opacity-40 ${reactionClass}`}>
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span>J'aime</span>
        {count > 0 ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
      </button>
      {comments && !commentLink && (
        <button type="button" onClick={() => setCommentOpen((value) => !value)} aria-expanded={commentOpen}
          className={`text-[13px] font-medium transition ${reactionClass}`}>
          {commentOpen ? "Fermer" : "Commenter"}
        </button>
      )}
      {commentLink ? (
        <Link href={commentLink} aria-label="Commenter" className={`inline-flex ${reactionClass}`}>
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
  const share = <ShareButton postId={postId} sharePath={sharePath} title={title} summary={summary} />;
  const thread = comments ? (
    <div id={`post-comments-${postId}`}>
      <CommentThread postId={postId} tone={tone} open={commentOpen} onSent={() => setCommentOpen(false)} />
    </div>
  ) : null;
  const likeError = message ? <span role="status" className={`w-full text-xs font-medium ${tone === "light" ? "text-sky-900" : "text-cyan-100"}`}>{message}</span> : null;

  if (shareOnly) return share;
  if (card) {
    return <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-3">
        {share}
        <button type="button" onClick={() => void react()} disabled={!enabled || busy}
          aria-pressed={liked} aria-label={liked ? "Retirer mon like" : "J'aime"}
          className="inline-flex items-center gap-1.5 text-[13px] text-white/70 transition hover:text-white disabled:opacity-40">
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current text-white" : ""}`} aria-hidden />
          {count > 0 ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
        </button>
        <Link href={`${sharePath}/${postId}#commenter`} aria-label="Commenter" className="inline-flex text-white/70 transition hover:text-white">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      {likeError}
    </div>;
  }
  if (dock) return thread;
  if (!floating) return <div className="flex min-w-0 flex-col gap-2"><div className="flex items-center gap-3">{share}{reactions}</div>{thread}{likeError}</div>;
  return <>
    {mounted ? createPortal(reactions, document.body) : null}
    {thread}
  </>;
}

export function DockReactions({ postId, comments = true }: { postId: string; comments?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    loadLike(postId)
      .then((state) => {
        if (!active) return;
        setEnabled(state.available === true);
        setCount(Math.max(0, Number(state.count) || 0));
        setLiked(state.liked === true);
      })
      .catch(() => { if (active) setEnabled(false); });
    return () => { active = false; };
  }, [postId]);

  async function react() {
    if (!enabled || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !liked }),
      });
      if (!response.ok) throw new Error();
      const state = await response.json() as ResponseState;
      setLiked(state.liked === true);
      setCount(Number(state.count) || 0);
    } catch { /* keep the previous state */ }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => void react()} disabled={!enabled || busy}
      aria-pressed={liked} aria-label={liked ? "Retirer mon like" : "J'aime"}
      className={`dock-icon${count > 0 ? " is-wide" : ""}${liked ? " is-on" : ""}`}>
      <Heart className={liked ? "fill-current" : ""} aria-hidden />
      {count > 0 ? <span className="dock-count">{count.toLocaleString("fr-FR")}</span> : null}
    </button>
    {comments ? (
      <button type="button" className="dock-icon" aria-label="Commenter"
        onClick={() => window.dispatchEvent(new CustomEvent("article-comments", { detail: postId }))}>
        <MessageCircle aria-hidden />
      </button>
    ) : null}
  </>;
}

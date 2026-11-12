"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Heart } from "lucide-react";
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

const SHARE_TARGETS: { id: ShareTarget; label: string }[] = [
  { id: "x", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "email", label: "Email" },
];

function selectedLanguage() {
  const lang = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
  return lang && lang !== "fr" && SITE_LANGUAGE_CODES.has(lang) ? lang : null;
}

function articleShareUrl(sharePath: string, postId: string) {
  return new URL(`${sharePath}/${encodeURIComponent(postId)}`, "https://patrickroziel.com").toString();
}

function coverShareUrl(postId: string, format?: "story") {
  const lang = selectedLanguage();
  const image = new URL(`/api/notes/${encodeURIComponent(postId)}/share-image`, "https://patrickroziel.com");
  image.searchParams.set("v", "12");
  if (lang) image.searchParams.set("lang", lang);
  if (format) image.searchParams.set("format", format);
  return image.toString();
}

function openPopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=720,height=760");
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

export function PostActions({ postId, title, summary = "", visible = true, sharePath = "/notes", tone = "dark", comments = false }: {
  postId: string; title: string; summary?: string; visible?: boolean; sharePath?: "/notes" | "/air"; tone?: "dark" | "light"; comments?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [commentOpen, setCommentOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!visible) return;
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
  }, [postId, visible]);

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

  async function shareTo(target: ShareTarget) {
    const url = articleShareUrl(sharePath, postId);
    const headline = title.trim() || "Patrick Roziel";
    const excerpt = summary.trim();
    const text = [excerpt, url].filter(Boolean).join("\n");
    setMessage("");
    try {
      if (target === "copy") {
        await navigator.clipboard.writeText(url);
        setMessage("Lien copié.");
        return;
      }
      if (target === "more") {
        if (typeof navigator.share === "function") {
          await navigator.share({ title: headline, text: excerpt || headline, url });
          return;
        }
        await navigator.clipboard.writeText(text);
        setMessage("Lien copié.");
        return;
      }
      if (target === "email") {
        window.location.href = `mailto:?subject=${encodeURIComponent(headline)}&body=${encodeURIComponent(text)}`;
        return;
      }
      if (target === "youtube") {
        await navigator.clipboard.writeText(text);
        openPopup("https://studio.youtube.com/");
        setMessage("Texte copié. Colle-le dans une publication YouTube.");
        return;
      }
      if (target === "instagram") {
        const imageUrl = coverShareUrl(postId, "story");
        try { await navigator.clipboard.writeText(text); } catch { /* the image can still be shared */ }
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error();
          const blob = await response.blob();
          const file = new File([blob], "story-patrick-roziel.png", { type: blob.type || "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] });
            setMessage("Dans Instagram, choisis Story. Le lien est copié pour le sticker.");
            return;
          }
          const download = document.createElement("a");
          download.href = URL.createObjectURL(blob);
          download.download = "story-patrick-roziel.png";
          download.click();
          setMessage("Image Story téléchargée. Le lien est copié : ajoute-le dans la story.");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
        setMessage("Le lien est copié. Ouvre Instagram, puis une story.");
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
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedExcerpt}`,
        threads: `https://www.threads.net/intent/post?text=${encodedMessage}`,
        bluesky: `https://bsky.app/intent/compose?text=${encodedMessage}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(coverShareUrl(postId))}&description=${encodedExcerpt}`,
      };
      const href = hrefs[target];
      if (target === "facebook" && excerpt) {
        try { await navigator.clipboard.writeText(excerpt); } catch { /* the link preview still opens */ }
        setMessage("Texte copié. Colle-le dans la publication.");
      }
      if (href) openPopup(href);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Lien copié.");
      } catch {
        setMessage("Impossible de partager pour le moment.");
      }
    }
  }

  const reactionClass = tone === "light"
    ? "text-[#1c1917]/80 hover:text-[#1c1917]"
    : sharePath === "/air"
      ? "text-white/80 hover:text-white"
      : "text-cyan-100 hover:text-white";
  const chipClass = tone === "light"
    ? "border-[#1c1917]/12 bg-transparent text-[#1c1917]/70 hover:bg-[#1c1917]/[0.04]"
    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200";

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => void react()} disabled={!enabled || busy}
        aria-pressed={liked} aria-label={liked ? "Retirer mon like" : "J'aime"}
        className={`inline-flex items-center gap-1.5 text-[13px] font-medium transition disabled:opacity-40 ${reactionClass}`}>
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span>J'aime</span>
        {count > 0 ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
      </button>
      {comments && (
        <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-expanded={commentOpen}
          className={`text-[13px] font-medium transition ${reactionClass}`}>
          {commentOpen ? "Fermer" : "Commenter"}
        </button>
      )}
    </div>
    {comments && <CommentThread postId={postId} tone={tone} open={commentOpen} onSent={() => setCommentOpen(false)} />}
    <div className="flex max-w-full flex-wrap gap-1" data-no-translate="true">
      {SHARE_TARGETS.map((item) => (
        <button key={item.id} type="button" onClick={() => void shareTo(item.id)}
          className={`inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-medium leading-none transition ${chipClass}`}>
          {item.label}
        </button>
      ))}
      <button type="button" onClick={() => void shareTo("more")}
        className={`inline-flex h-6 items-center rounded-full border px-2 text-[10px] font-medium leading-none transition ${chipClass}`}>
        Plus
      </button>
    </div>
    {message && <span role="status" className={`w-full text-xs font-medium ${tone === "light" ? "text-sky-900" : "text-cyan-100"}`}>{message}</span>}
  </div>;
}

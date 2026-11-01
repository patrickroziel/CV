"use client";
import { useEffect, useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { SITE_LANGUAGE_CODES, SITE_LANGUAGE_STORAGE_KEY } from "@/lib/site-translation";

type ResponseState = { available?: boolean; count?: number; liked?: boolean };
type ShareTarget = "x" | "facebook" | "instagram" | "youtube" | "whatsapp" | "linkedin" | "telegram" | "threads" | "bluesky" | "pinterest" | "email" | "copy" | "more";

const SHARE_TARGETS: { id: ShareTarget; label: string }[] = [
  { id: "x", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "telegram", label: "Telegram" },
  { id: "threads", label: "Threads" },
  { id: "bluesky", label: "Bluesky" },
  { id: "pinterest", label: "Pinterest" },
  { id: "email", label: "E-mail" },
  { id: "copy", label: "Copier" },
];

function selectedLanguage() {
  const lang = localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
  return lang && lang !== "fr" && SITE_LANGUAGE_CODES.has(lang) ? lang : null;
}

function articleShareUrl(sharePath: string, postId: string) {
  const shared = new URL(`${sharePath}/${encodeURIComponent(postId)}`, "https://patrickroziel.com");
  shared.searchParams.set("share", Date.now().toString(36));
  const lang = selectedLanguage();
  if (lang) shared.searchParams.set("lang", lang);
  return shared.toString();
}

function coverShareUrl(postId: string) {
  const lang = selectedLanguage();
  const image = new URL(`/api/notes/${encodeURIComponent(postId)}/share-image`, "https://patrickroziel.com");
  if (lang) image.searchParams.set("lang", lang);
  return image.toString();
}

function openPopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=720,height=760");
}

export function PostActions({ postId, title, visible = true, sharePath = "/notes", tone = "dark" }: {
  postId: string; title: string; visible?: boolean; sharePath?: "/notes" | "/air"; tone?: "dark" | "light";
}) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    let active = true;
    if (!visible) return;
    setReady(false);
    setEnabled(false);
    setCount(0);
    setLiked(false);
    fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, { cache: "no-store" })
      .then(res => res.ok ? res.json() as Promise<ResponseState> : Promise.reject())
      .then(state => {
        if (!active) return;
        setEnabled(state.available === true);
        setCount(Math.max(0, Number(state.count) || 0));
        setLiked(state.liked === true);
        setReady(true);
      })
      .catch(() => { if (active) { setEnabled(false); setReady(true); } });
    return () => { active = false; };
  }, [postId, visible]);

  if (!visible) return null;

  async function react() {
    if (!enabled || busy) {
      if (!enabled) setMessage("Like indisponible pour le moment.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(postId)}/likes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !liked }),
      });
      if (!response.ok) throw new Error();
      const state = await response.json() as ResponseState;
      setLiked(state.liked === true); setCount(Number(state.count) || 0);
    } catch { setMessage("Like indisponible, réessaie plus tard."); }
    finally { setBusy(false); }
  }

  async function shareTo(target: ShareTarget) {
    const url = articleShareUrl(sharePath, postId);
    const headline = title.trim() || "Patrick Roziel";
    const text = `${headline}\n${url}`;
    setMessage("");
    try {
      if (target === "copy") {
        await navigator.clipboard.writeText(url);
        setMessage("Lien copié.");
        return;
      }
      if (target === "more") {
        await navigator.share({ title: headline, text: headline, url });
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
        const imageUrl = coverShareUrl(postId);
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error();
          const blob = await response.blob();
          const file = new File([blob], "patrick-roziel.jpg", { type: blob.type || "image/jpeg" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: headline, text });
            return;
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
        await navigator.clipboard.writeText(text);
        openPopup("https://www.instagram.com/");
        setMessage("Image ou texte prêt. Choisis Instagram Story, puis colle le lien.");
        return;
      }
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(text);
      const encodedTitle = encodeURIComponent(headline);
      const hrefs: Partial<Record<ShareTarget, string>> = {
        x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
        threads: `https://www.threads.net/intent/post?text=${encodedText}`,
        bluesky: `https://bsky.app/intent/compose?text=${encodedText}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(coverShareUrl(postId))}&description=${encodedTitle}`,
      };
      const href = hrefs[target];
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

  const likeClass = tone === "light"
    ? "border-rose-700 bg-rose-600 text-white shadow-sm"
    : "border-rose-200/50 bg-rose-500 text-white shadow-[0_10px_24px_-14px_rgba(244,63,94,0.95)]";
  const shareClass = tone === "light"
    ? "border-sky-950 bg-sky-900 text-white shadow-sm"
    : "border-cyan-100/40 bg-cyan-300 text-slate-950";
  const chipClass = tone === "light"
    ? "border-slate-900/15 bg-white text-slate-900 hover:bg-slate-50"
    : "border-white/15 bg-white/10 text-white hover:bg-white/16";

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button type="button" onClick={() => void react()}
        aria-pressed={liked} title={liked ? "Retirer mon like" : "J'aime"}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:brightness-110 ${likeClass} ${liked ? "ring-2 ring-white/70" : ""}`}>
        <Heart className="h-4 w-4 fill-current" aria-hidden />
        <span>J'aime</span>
        {ready && enabled ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
      </button>
      <button type="button" onClick={() => { setShareOpen((open) => !open); setMessage(""); }}
        aria-expanded={shareOpen}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition hover:brightness-110 ${shareClass}`}
        aria-label={`Partager ${title || "la publication"}`}>
        <Share2 className="h-4 w-4" aria-hidden /> Partager
      </button>
    </div>
    {shareOpen && (
      <div className="flex max-w-xl flex-wrap gap-1.5" data-no-translate="true">
        {SHARE_TARGETS.map((item) => (
          <button key={item.id} type="button" onClick={() => void shareTo(item.id)}
            className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${chipClass}`}>
            {item.label}
          </button>
        ))}
        {canNativeShare && (
          <button type="button" onClick={() => void shareTo("more")}
            className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${chipClass}`}>
            Plus
          </button>
        )}
      </div>
    )}
    {message && <span role="status" className={`w-full text-xs font-medium ${tone === "light" ? "text-sky-900" : "text-cyan-100"}`}>{message}</span>}
  </div>;
}

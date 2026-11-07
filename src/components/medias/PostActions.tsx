"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { SITE_LANGUAGE_CODES, SITE_LANGUAGE_STORAGE_KEY } from "@/lib/site-translation";

type ResponseState = { available?: boolean; count?: number; liked?: boolean };
type ShareTarget = "x" | "facebook" | "instagram" | "youtube" | "whatsapp" | "linkedin" | "telegram" | "threads" | "bluesky" | "pinterest" | "email" | "copy" | "more";

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
  const shared = new URL(`${sharePath}/${encodeURIComponent(postId)}`, "https://patrickroziel.com");
  shared.searchParams.set("share", Date.now().toString(36));
  const lang = selectedLanguage();
  if (lang) shared.searchParams.set("lang", lang);
  return shared.toString();
}

function coverShareUrl(postId: string, format?: "story") {
  const lang = selectedLanguage();
  const image = new URL(`/api/notes/${encodeURIComponent(postId)}/share-image`, "https://patrickroziel.com");
  image.searchParams.set("v", "11");
  if (lang) image.searchParams.set("lang", lang);
  if (format) image.searchParams.set("format", format);
  return image.toString();
}

function openPopup(href: string) {
  window.open(href, "_blank", "noopener,noreferrer,width=720,height=760");
}

export function PostActions({ postId, title, summary = "", visible = true, sharePath = "/notes", tone = "dark" }: {
  postId: string; title: string; summary?: string; visible?: boolean; sharePath?: "/notes" | "/air"; tone?: "dark" | "light";
}) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
    const excerpt = summary.trim();
    const message = [excerpt, url].filter(Boolean).join("\n");
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
        await navigator.clipboard.writeText(message);
        setMessage("Lien copié.");
        return;
      }
      if (target === "email") {
        window.location.href = `mailto:?subject=${encodeURIComponent(headline)}&body=${encodeURIComponent(message)}`;
        return;
      }
      if (target === "youtube") {
        await navigator.clipboard.writeText(message);
        openPopup("https://studio.youtube.com/");
        setMessage("Texte copié. Colle-le dans une publication YouTube.");
        return;
      }
      if (target === "instagram") {
        const imageUrl = coverShareUrl(postId, "story");
        try { await navigator.clipboard.writeText(message); } catch { /* the image can still be shared */ }
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
      const encodedMessage = encodeURIComponent(message);
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

  const likeClass = tone === "light"
    ? liked
      ? "border-[#1c1917]/20 bg-[#1c1917]/[0.04] text-[#7f1d1d]"
      : "border-[#1c1917]/12 bg-transparent text-[#1c1917]/80 hover:border-[#1c1917]/25 hover:bg-[#1c1917]/[0.03]"
    : liked
      ? "border-white/25 bg-white/[0.07] text-rose-100"
      : "border-white/14 bg-white/[0.03] text-zinc-200 hover:border-white/28 hover:bg-white/[0.06]";
  const chipClass = tone === "light"
    ? "border-[#1c1917]/12 bg-transparent text-[#1c1917]/75 hover:bg-[#1c1917]/[0.04]"
    : "border-white/12 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.07]";

  return <div className="flex min-w-0 flex-col gap-2">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <button type="button" onClick={() => void react()}
        aria-pressed={liked} title={liked ? "Retirer mon like" : "J'aime"}
        className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[0.78rem] font-medium tracking-[0.01em] transition ${likeClass}`}>
        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} aria-hidden />
        <span>J'aime</span>
        {ready && enabled ? <span className="tabular-nums">{count.toLocaleString("fr-FR")}</span> : null}
      </button>
    </div>
    <div className="flex max-w-full flex-wrap gap-1.5" data-no-translate="true">
      {SHARE_TARGETS.map((item) => (
        <button key={item.id} type="button" onClick={() => void shareTo(item.id)}
          className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${chipClass}`}>
          {item.label}
        </button>
      ))}
      <button type="button" onClick={() => void shareTo("more")}
        className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold transition ${chipClass}`}>
        Plus
      </button>
    </div>
    {message && <span role="status" className={`w-full text-xs font-medium ${tone === "light" ? "text-sky-900" : "text-cyan-100"}`}>{message}</span>}
  </div>;
}

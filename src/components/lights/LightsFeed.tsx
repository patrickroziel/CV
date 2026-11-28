"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { LightsIcon } from "@/components/layout/universe-icons";
import { UniversesWidget } from "@/components/notes/UniversesWidget";
import { LightActions } from "@/components/lights/LightActions";
import { XEmbed } from "@/components/projects/XEmbed";
import { collectLightCards, type LightCard } from "@/lib/lights";
import type { InlinePostMedia, LightKind, LightRatio } from "@/lib/types";
import { getL, setL } from "@/lib/i18n-content";
import { mediaMarker } from "@/lib/post-inline-media";
import { uploadToBlob, MEDIA_FOLDERS } from "@/lib/blob-upload";
import { vimeoCanonical, xPostUrl, youtubeEmbedUrl, youtubeVideoId } from "@/lib/utils";

const FILTERS: { id: "all" | LightKind; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "words", label: "Mots" },
  { id: "quote", label: "Citations" },
  { id: "image", label: "Images" },
  { id: "video", label: "Vidéos" },
  { id: "x", label: "X" },
  { id: "instagram", label: "Instagram" },
];

const RATIOS: { id: LightRatio; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "1:1", label: "Carré" },
  { id: "4:5", label: "Portrait" },
  { id: "16:9", label: "Paysage" },
];

function frameClass(kind: LightCard["kind"], ratio: LightRatio) {
  if (ratio === "1:1") return "relative aspect-square";
  if (ratio === "4:5") return "relative aspect-[4/5]";
  if (ratio === "16:9") return "relative aspect-video";
  if (kind === "image") return "";
  if (kind === "instagram") return "relative aspect-[4/5]";
  return "relative aspect-video";
}

const KINDS: { id: LightKind; label: string }[] = [
  { id: "words", label: "Quelques mots" },
  { id: "quote", label: "Citation" },
  { id: "image", label: "Image" },
  { id: "video", label: "Vidéo" },
  { id: "x", label: "Post X" },
  { id: "instagram", label: "Post Instagram" },
];

function FileStill({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const seek = () => {
      const mark = Math.min(0.5, (video.duration || 1) / 5);
      try { video.currentTime = mark; } catch { /* the first frame stays */ }
    };
    video.addEventListener("loadeddata", seek, { once: true });
    return () => video.removeEventListener("loadeddata", seek);
  }, [src]);
  return (
    <video
      ref={ref}
      src={src}
      muted
      playsInline
      preload="auto"
      className="pointer-events-none h-full w-full bg-black object-contain"
    />
  );
}

function articleId(href: string | null) {
  return href?.match(/^\/(?:notes|air)\/([^/?#]+)$/)?.[1] ?? null;
}

function shareUrlOf(item: LightCard) {
  if (item.href) return `https://patrickroziel.com${item.href}`;
  return `https://patrickroziel.com/lights#${encodeURIComponent(item.id)}`;
}

function embedOf(item: LightCard, id: string): InlinePostMedia | null {
  if ((item.kind === "words" || item.kind === "quote") && item.text) {
    return { id, type: "text", title: "", body: item.text };
  }
  if (!item.mediaUrl) return null;
  if (item.kind === "image") return { id, type: "image", url: item.mediaUrl };
  if (item.kind === "x") return { id, type: "x", url: item.mediaUrl };
  if (item.kind === "instagram") return { id, type: "text", title: "Instagram", body: item.mediaUrl };
  if (youtubeVideoId(item.mediaUrl)) return { id, type: "youtube", url: item.mediaUrl };
  if (vimeoCanonical(item.mediaUrl)) return { id, type: "vimeo", url: item.mediaUrl };
  if (item.kind === "video") return { id, type: "video", url: item.mediaUrl };
  return null;
}

async function frameFile(file: File) {
  const local = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = local;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Aperçu impossible."));
    });
    const mark = Math.min(0.5, (video.duration || 1) / 5);
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      video.addEventListener("seeked", done, { once: true });
      window.setTimeout(done, 800);
      try { video.currentTime = mark; } catch { done(); }
    });
    if (!video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/jpeg", 0.82));
    return blob ? new File([blob], "apercu.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(local);
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  if (!iso) return "";
  const value = new Date(`${iso}T12:00:00`);
  return Number.isNaN(value.getTime()) ? iso : value.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function MediaFace({ item, open, onOpen }: { item: LightCard; open: boolean; onOpen: () => void }) {
  if (item.kind === "words" || item.kind === "quote" || item.kind === "x") return null;
  if (item.kind === "instagram" && item.embed) {
    return <iframe src={item.embed} title={item.text || "Instagram"} className="absolute inset-0 h-full w-full bg-white" allow="encrypted-media" />;
  }
  if (open && item.embed) {
    return (
      <iframe
        src={youtubeEmbedUrl(item.mediaUrl || "", { autoplay: true }) ?? item.embed}
        title={item.text || "Vidéo"}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (open && item.file && item.mediaUrl) {
    return <video src={item.mediaUrl} className="absolute inset-0 h-full w-full bg-black" controls autoPlay playsInline />;
  }
  if (item.kind === "image" && item.mediaUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.mediaUrl}
        alt=""
        className={item.ratio === "original" ? "block h-auto w-full" : "absolute inset-0 h-full w-full object-contain"}
      />
    );
  }
  if (item.kind === "video") {
    return (
      <button type="button" onClick={onOpen} className="absolute inset-0" aria-label="Lire la vidéo">
        {item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumb} alt="" className="h-full w-full object-contain" />
        ) : item.file && item.mediaUrl ? (
          <FileStill src={item.mediaUrl} />
        ) : (
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,0.28),transparent_42%),linear-gradient(160deg,#071422,#02060c)]" />
        )}
        <span className="absolute inset-0 bg-black/20" />
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/35 text-white">
          <LightsIcon className="h-5 w-5" />
        </span>
      </button>
    );
  }
  return null;
}

function LightComposer() {
  const { addLightNote } = usePortfolio();
  const [kind, setKind] = useState<LightKind>("words");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [thumb, setThumb] = useState<string | null>(null);
  const [ratio, setRatio] = useState<LightRatio>("original");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const needsUrl = kind === "image" || kind === "video" || kind === "x" || kind === "instagram";

  async function onFile(file: File) {
    setBusy(true);
    setError("");
    try {
      const uploaded = await uploadToBlob(file, { folder: MEDIA_FOLDERS.media });
      setUrl(uploaded.url);
      const video = file.type.startsWith("video/");
      setKind(video ? "video" : "image");
      if (video) {
        const poster = await frameFile(file);
        if (poster) {
          const shot = await uploadToBlob(poster, { folder: MEDIA_FOLDERS.media });
          setThumb(shot.url);
        }
      } else {
        setThumb(null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  function publish() {
    const words = text.replace(/\s+/g, " ").trim();
    let link = url.trim();
    if ((kind === "words" || kind === "quote") && !words) {
      setError("Écris quelques mots.");
      return;
    }
    if (needsUrl && kind !== "x" && !link.startsWith("https://")) {
      setError("Il faut une adresse https.");
      return;
    }
    if (kind === "x") {
      const raw = link.startsWith("http://") ? `https://${link.slice(7)}` : link;
      const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/\//, "")}`;
      const canonical = xPostUrl(withProtocol);
      if (!canonical) {
        setError("Colle le lien d’un post X, avec /status/ dans l’adresse.");
        return;
      }
      link = canonical;
    }
    addLightNote({
      id: crypto.randomUUID(),
      kind,
      text: words,
      url: needsUrl ? link : null,
      ratio: kind === "image" || kind === "video" ? ratio : "original",
      thumb: kind === "video" ? thumb : null,
      date: today(),
      postedAt: new Date().toISOString(),
      visible: true,
    });
    setText("");
    setUrl("");
    setThumb(null);
    setError("");
  }

  return (
    <form className="mb-6 rounded-2xl border border-white/15 bg-black/35 p-4" onSubmit={(event) => { event.preventDefault(); publish(); }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/80">Publier dans Lights</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {KINDS.map((entry) => (
          <button key={entry.id} type="button" onClick={() => setKind(entry.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${kind === entry.id ? "border-white/50 bg-white text-zinc-950" : "border-white/15 text-zinc-200"}`}>
            {entry.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={kind === "quote" ? 4 : 2}
        maxLength={500}
        placeholder={kind === "quote" ? "La citation" : "Quelques mots, si tu veux"}
        className="w-full resize-y rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-base text-white outline-none"
      />
      {needsUrl && (
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={kind === "image" || kind === "video" ? "Adresse du fichier, ou envoie-le" : "Adresse du post"}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-base text-white outline-none"
        />
      )}
      {(kind === "image" || kind === "video") && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Ratio">
          {RATIOS.map((entry) => (
            <button key={entry.id} type="button" onClick={() => setRatio(entry.id)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${ratio === entry.id ? "border-white/50 bg-white text-zinc-950" : "border-white/15 text-zinc-200"}`}>
              {entry.label}
            </button>
          ))}
        </div>
      )}
      {(kind === "image" || kind === "video") && (
        <label className="mt-2 inline-flex cursor-pointer text-xs font-medium text-cyan-100">
          {busy ? "Envoi…" : "Envoyer un fichier"}
          <input type="file" accept={kind === "video" ? "video/*" : "image/*,video/*"} className="sr-only" disabled={busy} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }} />
        </label>
      )}
      {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
      <button type="submit" disabled={busy} className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">
        Publier · {formatDate(today())}
      </button>
    </form>
  );
}

export function LightsFeed() {
  const { data, l, editMode, removeLightNote, updateLightNote, updateSocialPost } = usePortfolio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [embedNote, setEmbedNote] = useState("");
  const items = useMemo(
    () => collectLightCards({
      posts: data.socialPosts ?? [],
      projects: data.projects ?? [],
      notes: data.lightNotes ?? [],
      showreel: data.mainShowreel,
      features: data.featureVideos,
      titleOf: (value, fallback) => (value ? l(value).trim() : "") || fallback,
      includeHidden: editMode,
    }),
    [data.socialPosts, data.projects, data.lightNotes, data.mainShowreel, data.featureVideos, l, editMode],
  );
  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const articles = (data.socialPosts ?? []).filter((post) => post.visible !== false);
  const embedding = items.find((item) => item.id === embedId) ?? null;

  function placeInArticle(postId: string) {
    if (!embedding) return;
    const post = articles.find((item) => item.id === postId);
    if (!post) return;
    const id = crypto.randomUUID();
    const media = embedOf(embedding, id);
    if (!media) {
      setEmbedNote("Ce post ne peut pas entrer dans un article.");
      return;
    }
    const description = getL(post.description, "fr");
    const marker = `<p>${mediaMarker(id)}</p>`;
    updateSocialPost(postId, {
      inlineMedia: [...(post.inlineMedia ?? []), media],
      description: setL(post.description, "fr", description.includes(mediaMarker(id)) ? description : `${description}${marker}`),
    });
    const section = post.universe === "air" ? "Air" : "Notes";
    setEmbedNote(`Intégré dans ${section} · ${l(post.title).trim() || "Sans titre"}.`);
    setEmbedId(null);
  }

  return (
    <div className="mx-auto grid min-w-0 max-w-[1180px] gap-4 px-3 pb-24 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
      <aside className="min-w-0">
        <div className="universe-rail">
          <SectionHeading title="Lights">Citations, images, vidéos et posts.</SectionHeading>
          <nav aria-label="Filtres" className="mt-7 hidden space-y-0.5 md:block">
            {FILTERS.map((entry) => {
              const active = filter === entry.id;
              const total = entry.id === "all" ? items.length : items.filter((item) => item.kind === entry.id).length;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFilter(active && entry.id !== "all" ? "all" : entry.id)}
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                    active ? "bg-white/[0.12] text-white" : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                  ].join(" ")}
                >
                  <span className="truncate">{entry.label}</span>
                  <span className="text-[11px] tabular-nums text-white/40">{total}</span>
                </button>
              );
            })}
          </nav>
          <UniversesWidget current="lights" />
        </div>
        <nav aria-label="Filtres" className="section-menu-bar mt-3 md:hidden">
          {FILTERS.map((entry) => {
            const active = filter === entry.id;
            const total = entry.id === "all" ? items.length : items.filter((item) => item.kind === entry.id).length;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFilter(active && entry.id !== "all" ? "all" : entry.id)}
                className={[
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span>{entry.label}</span>
                <span className="text-[11px] tabular-nums text-white/40">{total}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="min-w-0">
      {editMode && <LightComposer />}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-zinc-300">
          Rien dans ce filtre pour l’instant.
        </p>
      ) : (
        <ol className="grid gap-4">
          {visible.map((item) => {
            const face = item.kind === "image" || item.kind === "video" || item.kind === "instagram";
            return (
              <li key={item.id} id={item.id} className="overflow-hidden rounded-2xl border border-white/12 bg-black/30">
                {item.kind === "x" && item.mediaUrl ? (
                  <XEmbed url={item.mediaUrl} className="rounded-none border-0" />
                ) : face && (
                  <div className={`bg-black ${frameClass(item.kind, item.ratio)}`}>
                    <MediaFace item={item} open={openId === item.id} onOpen={() => setOpenId(item.id)} />
                  </div>
                )}
                <div className="px-3.5 py-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    <span>{item.source ?? (item.kind === "quote" ? "Citation" : item.kind === "x" ? "X" : item.kind === "instagram" ? "Instagram" : "Lights")}</span>
                    <span className="font-medium normal-case tracking-normal">{formatDate(item.date)}</span>
                  </div>
                  {item.text && (
                    <p className={item.kind === "quote" ? "font-serif text-lg leading-snug text-white" : "text-sm leading-6 text-zinc-100"}>
                      {item.kind === "quote" ? `« ${item.text} »` : item.text}
                    </p>
                  )}
                  <LightActions
                    reactId={item.ownId ?? articleId(item.href)}
                    shareUrl={shareUrlOf(item)}
                    title={item.text || "Lights"}
                    text={item.text}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {item.href ? (
                      <Link href={item.href} className="text-[11px] font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">
                        Ouvrir l’article
                      </Link>
                    ) : <span />}
                    {editMode && item.ownId && (item.kind === "image" || item.kind === "video") && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {RATIOS.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => updateLightNote(item.ownId!, { ratio: entry.id })}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.ratio === entry.id ? "border-white/50 bg-white text-zinc-950" : "border-white/15 text-zinc-300"}`}
                          >
                            {entry.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {editMode && item.ownId && (
                      <button type="button" onClick={() => { setEmbedId(item.id); setEmbedNote(""); }} className="text-[11px] font-semibold text-cyan-100">
                        Intégrer dans un article
                      </button>
                    )}
                    {editMode && item.ownId && (
                      <button type="button" onClick={() => removeLightNote(item.ownId!)} className="inline-flex items-center gap-1 text-[11px] text-red-200" title="Retirer">
                        <Trash2 className="h-3.5 w-3.5" /> Retirer
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {embedNote && <p className="mt-4 text-sm text-cyan-100">{embedNote}</p>}
      {embedding && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-3 sm:items-center sm:justify-center">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-zinc-950 p-4" role="dialog" aria-labelledby="embed-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="embed-title" className="text-lg font-semibold text-white">Intégrer dans un article</h2>
              <button type="button" onClick={() => setEmbedId(null)} className="text-sm text-zinc-300">Fermer</button>
            </div>
            {articles.length === 0 ? (
              <p className="text-sm text-zinc-300">Aucun article pour l’instant.</p>
            ) : (
              <ul className="grid gap-2">
                {articles.map((post) => (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => placeInArticle(post.id)}
                      className="flex w-full flex-col items-start rounded-xl border border-white/15 px-3 py-3 text-left"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/80">
                        {post.universe === "air" ? "Air" : "Notes"}
                      </span>
                      <span className="text-sm text-white">{l(post.title).trim() || "Sans titre"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

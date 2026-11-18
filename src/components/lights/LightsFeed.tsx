"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { LightsIcon } from "@/components/layout/universe-icons";
import { XEmbed } from "@/components/projects/XEmbed";
import { collectLightCards, type LightCard } from "@/lib/lights";
import type { LightKind, LightRatio } from "@/lib/types";
import { uploadToBlob, MEDIA_FOLDERS } from "@/lib/blob-upload";
import { xPostUrl, youtubeEmbedUrl } from "@/lib/utils";

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
          <img src={item.thumb} alt="" className="h-full w-full object-cover" />
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
      setKind(file.type.startsWith("video/") ? "video" : "image");
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
      date: today(),
      postedAt: new Date().toISOString(),
      visible: true,
    });
    setText("");
    setUrl("");
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
  const { data, l, editMode, removeLightNote, updateLightNote } = usePortfolio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
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

  return (
    <div className="mx-auto w-full max-w-xl px-3 sm:px-6">
      <header className="mb-6">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
          <LightsIcon className="h-3.5 w-3.5" />
          Lights
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Fil</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          Citations, images, vidéos et posts. Les médias des articles apparaissent ici.
        </p>
      </header>

      {editMode && <LightComposer />}

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Filtres">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={filter === entry.id}
            onClick={() => setFilter(entry.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === entry.id ? "border-white/50 bg-white text-zinc-950" : "border-white/15 bg-white/5 text-zinc-200"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-zinc-300">
          Rien dans ce filtre pour l’instant.
        </p>
      ) : (
        <ol className="grid gap-4">
          {visible.map((item) => {
            const face = item.kind === "image" || item.kind === "video" || item.kind === "instagram";
            return (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-white/12 bg-black/30">
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
                  <div className="mt-2 flex items-center justify-between gap-3">
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
    </div>
  );
}

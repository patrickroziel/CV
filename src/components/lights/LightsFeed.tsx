"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { AirIcon, LightsIcon, WaterIcon, WoodIcon } from "@/components/layout/universe-icons";
import { collectLightItems, type LightCategory, type LightItem } from "@/lib/lights";
import { youtubeEmbedUrl } from "@/lib/utils";

const FILTERS: { id: "all" | LightCategory; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "notes", label: "Notes" },
  { id: "air", label: "Air" },
  { id: "work", label: "Work" },
];

const TONE: Record<LightCategory, string> = {
  notes: "text-cyan-100",
  air: "text-sky-100",
  work: "text-amber-100",
};

function Mark({ category }: { category: LightCategory }) {
  const Icon = category === "air" ? AirIcon : category === "work" ? WoodIcon : WaterIcon;
  return <Icon className="h-3 w-3" />;
}

function VideoFace({ item, open, onOpen }: { item: LightItem; open: boolean; onOpen: () => void }) {
  if (open && item.embed) {
    return (
      <iframe
        src={youtubeEmbedUrl(item.watchUrl, { autoplay: true }) ?? item.embed}
        title={item.title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  if (open && item.file) {
    return <video src={item.watchUrl} className="absolute inset-0 h-full w-full bg-black" controls autoPlay playsInline />;
  }
  return (
    <button type="button" onClick={onOpen} className="absolute inset-0" aria-label={`Lire ${item.title}`}>
      {item.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumb} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,0.28),transparent_42%),linear-gradient(160deg,#071422,#02060c)]" />
      )}
      <span className="absolute inset-0 bg-black/20" />
      <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-md">
        <LightsIcon className="h-5 w-5" />
      </span>
    </button>
  );
}

export function LightsFeed() {
  const { data, l, editMode } = usePortfolio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = useMemo(
    () =>
      collectLightItems({
        posts: data.socialPosts ?? [],
        projects: data.projects ?? [],
        showreel: data.mainShowreel,
        features: data.featureVideos,
        titleOf: (value, fallback) => (value ? l(value).trim() : "") || fallback,
        includeHidden: editMode,
      }),
    [data.socialPosts, data.projects, data.mainShowreel, data.featureVideos, l, editMode],
  );
  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-6">
      <header className="mb-6">
        <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
          <LightsIcon className="h-3.5 w-3.5" />
          Lights
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Interventions vidéo</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
          Les vidéos postées dans Notes, Air et Work. Le fil se met à jour tout seul.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Catégories">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={filter === entry.id}
            onClick={() => setFilter(entry.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === entry.id
                ? "border-white/50 bg-white text-zinc-950"
                : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            }`}
          >
            {entry.id !== "all" && <Mark category={entry.id} />}
            {entry.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-zinc-300">
          Aucune vidéo dans cette catégorie pour l’instant.
        </p>
      ) : (
        <ol className="grid gap-4">
          {visible.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-white/12 bg-black/30 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="relative aspect-video bg-black">
                <VideoFace item={item} open={openId === item.id} onOpen={() => setOpenId(item.id)} />
              </div>
              <div className="flex items-start justify-between gap-3 px-3.5 py-3">
                <div className="min-w-0">
                  <p className={`mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${TONE[item.category]}`}>
                    <Mark category={item.category} />
                    {item.category === "notes" ? "Notes" : item.category === "air" ? "Air" : "Work"}
                  </p>
                  <h2 className="truncate text-sm font-semibold text-white sm:text-base">{item.title}</h2>
                </div>
                <Link href={item.href} className="shrink-0 pt-1 text-[11px] font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">
                  Ouvrir
                </Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Heart,
  MessageCircle,
  Pin,
  RefreshCw,
  Repeat2,
} from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassCard";
import { extractXUsername, xProfileHref } from "@/lib/utils";
import type { XTimelineResult, XTimelineTweet } from "@/lib/x-timeline";

type XFeedWidgetProps = {
  username: string;
  title: string;
  profileUrl?: string;
};

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatWhen(createdAt?: string | null): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} j`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function TweetCard({ tweet }: { tweet: XTimelineTweet }) {
  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-black/35 p-2.5 transition hover:border-teal-300/25 hover:bg-white/[0.04]"
    >
      <div className="mb-1.5 flex items-start gap-2">
        {tweet.authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tweet.authorAvatar}
            alt=""
            className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-zinc-800 object-cover"
          />
        ) : (
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="truncate text-[11px] font-semibold text-zinc-100">
              {tweet.authorName || tweet.authorHandle || "X"}
            </span>
            {tweet.authorHandle && (
              <span className="truncate text-[10px] text-zinc-500">
                @{tweet.authorHandle}
              </span>
            )}
            {tweet.pinned && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-300/90">
                <Pin className="h-2.5 w-2.5" />
                Épinglé
              </span>
            )}
            {tweet.createdAt && (
              <span className="ml-auto shrink-0 text-[10px] text-zinc-600">
                {formatWhen(tweet.createdAt)}
              </span>
            )}
          </div>
          {tweet.text && (
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300">
              {tweet.text.length > 280
                ? `${tweet.text.slice(0, 277)}…`
                : tweet.text}
            </p>
          )}
        </div>
      </div>

      {tweet.mediaUrl && (
        <div className="relative mb-1.5 overflow-hidden rounded-lg border border-white/8 bg-black/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tweet.mediaUrl}
            alt=""
            className="max-h-36 w-full object-cover"
            loading="lazy"
          />
          {tweet.mediaType === "video" && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-zinc-200">
              Vidéo
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        {tweet.replies != null && (
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="h-3 w-3" />
            {formatCount(tweet.replies)}
          </span>
        )}
        {tweet.retweets != null && (
          <span className="inline-flex items-center gap-0.5">
            <Repeat2 className="h-3 w-3" />
            {formatCount(tweet.retweets)}
          </span>
        )}
        {tweet.likes != null && (
          <span className="inline-flex items-center gap-0.5">
            <Heart className="h-3 w-3" />
            {formatCount(tweet.likes)}
          </span>
        )}
      </div>
    </a>
  );
}

/**
 * Custom X feed — does not rely on widgets.js createTimeline
 * (often empty for accounts with sensitive media / embed limits).
 */
export function XFeedWidget({ username, title, profileUrl }: XFeedWidgetProps) {
  const handle =
    extractXUsername(username) || extractXUsername(profileUrl || "");
  const [data, setData] = useState<XTimelineResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!handle) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    const ctrl = new AbortController();
    setStatus("loading");

    fetch(`/api/x/timeline?user=${encodeURIComponent(handle)}`, {
      signal: ctrl.signal,
    })
      .then(async (res) => {
        const json = (await res.json()) as XTimelineResult & { error?: string };
        if (cancelled) return;
        setData(json);
        if (!res.ok && !json.tweets?.length && !json.user) {
          setStatus("error");
        } else {
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setStatus("error");
        setData(null);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [handle, reloadKey]);

  if (!handle) {
    return (
      <GlassPanel className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Définissez un @username X en Mode Édition (Contact → widget X).
        </p>
      </GlassPanel>
    );
  }

  const href = xProfileHref(handle) || `https://x.com/${handle}`;
  const user = data?.user;
  const tweets = data?.tweets ?? [];

  return (
    <GlassPanel className="overflow-hidden p-3">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-md p-1 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
            aria-label="Actualiser le feed X"
            title="Actualiser"
          >
            <RefreshCw
              className={`h-3 w-3 ${status === "loading" ? "animate-spin" : ""}`}
            />
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-teal-300/90 transition hover:text-teal-200"
          >
            @{handle}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Profile strip */}
      {user && (
        <a
          href={user.url || href}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2 transition hover:border-white/15"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
            />
          ) : (
            <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-100">
              {user.name}
              {user.verified && (
                <span className="ml-1 text-[10px] text-sky-400">✓</span>
              )}
            </p>
            <p className="truncate text-[10px] text-zinc-500">
              @{user.screenName}
              {user.followers != null && (
                <span className="text-zinc-600">
                  {" "}
                  · {formatCount(user.followers)} abonnés
                </span>
              )}
            </p>
          </div>
        </a>
      )}

      <div className="x-feed-scroll max-h-[360px] min-h-[120px] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
        {status === "loading" && tweets.length === 0 && (
          <div className="space-y-2 py-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-white/5"
              />
            ))}
            <p className="pt-1 text-center text-[10px] text-zinc-500">
              Chargement des posts X…
            </p>
          </div>
        )}

        {status === "ready" &&
          tweets.map((t) => <TweetCard key={t.id} tweet={t} />)}

        {status === "ready" && tweets.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/25 px-3 py-4 text-center">
            <p className="text-[11px] text-zinc-400">
              {data?.error ||
                "Aucun post affiché (X limite les embeds pour ce compte)."}
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-teal-300 hover:underline"
            >
              Voir le profil sur X
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2 py-2 text-center">
            <p className="text-[10px] text-zinc-500">
              Impossible de charger le feed (réseau / API).
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-xs text-teal-300 hover:underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassCard";
import { extractXUsername, xProfileHref } from "@/lib/utils";

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void;
        createTimeline: (
          source: { sourceType: string; screenName: string },
          element: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

function loadTwitterWidgets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr?.widgets) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      // already loaded
      if (window.twttr?.widgets) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://platform.twitter.com/widgets.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("widgets.js"));
    document.body.appendChild(s);
  });
}

type XFeedWidgetProps = {
  username: string;
  title: string;
  profileUrl?: string;
};

/**
 * Dark X/Twitter profile timeline in a glass panel.
 */
export function XFeedWidget({ username, title, profileUrl }: XFeedWidgetProps) {
  const handle = extractXUsername(username) || extractXUsername(profileUrl || "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const uid = useId();

  useEffect(() => {
    if (!handle || !containerRef.current) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const el = containerRef.current;
    el.innerHTML = "";
    setStatus("loading");

    loadTwitterWidgets()
      .then(() => {
        if (cancelled || !window.twttr?.widgets || !containerRef.current) return;
        return window.twttr.widgets.createTimeline(
          { sourceType: "profile", screenName: handle },
          containerRef.current,
          {
            height: 360,
            theme: "dark",
            chrome: "noheader nofooter noborders transparent",
            dnt: true,
            lang: "fr",
          }
        );
      })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (el) el.innerHTML = "";
    };
  }, [handle, uid]);

  if (!handle) {
    return (
      <GlassPanel className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Définissez un @username X en Mode Édition.
        </p>
      </GlassPanel>
    );
  }

  const href = xProfileHref(handle) || `https://x.com/${handle}`;

  return (
    <GlassPanel className="overflow-hidden p-3">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </p>
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
      <div
        ref={containerRef}
        className="x-feed-scroll max-h-[360px] min-h-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/30"
      />
      {status === "loading" && (
        <p className="mt-2 text-center text-[10px] text-zinc-500">
          Chargement du feed X…
        </p>
      )}
      {status === "error" && (
        <div className="mt-2 space-y-2 text-center">
          <p className="text-[10px] text-zinc-500">
            Embed indisponible (bloqueur / réseau).
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-teal-300 hover:underline"
          >
            Ouvrir @{handle} sur X
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </GlassPanel>
  );
}

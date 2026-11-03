"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

type Props = { articleId: string; tone?: "dark" | "light" };

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function ArticleAudioPlayer({ articleId, tone = "dark" }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState<"male" | "female">("male");
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const light = tone === "light";
  const shell = light
    ? "border-slate-900/10 bg-white/55 text-slate-900"
    : "border-white/10 bg-white/[0.045] text-zinc-100";
  const muted = light ? "text-slate-600" : "text-zinc-400";

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  async function startPlayback() {
    const audio = audioRef.current;
    if (!audio || loading) return;
    setError("");

    if (audio.src && audio.src.startsWith("blob:")) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setError("La lecture audio n'a pas pu démarrer.");
      }
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: articleId, voice }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Impossible de générer la lecture audio.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = url;
      audio.src = url;
      audio.playbackRate = speed;
      await audio.play();
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function changeVoice(value: "male" | "female") {
    setVoice(value);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  return (
    <section aria-label="Écouter cet article" className={`my-5 rounded-2xl border p-4 backdrop-blur-xl sm:p-5 ${shell}`}>
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (playing) {
              audioRef.current?.pause();
            } else {
              void startPlayback();
            }
          }}
          disabled={loading}
          aria-label={playing ? "Mettre en pause" : "Écouter l'article"}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition disabled:opacity-60 ${light ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-cyan-100 text-slate-950 hover:bg-white"}`}
        >
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <div className="min-w-[9rem] flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold"><Volume2 className="h-4 w-4" /> Écouter l'article</p>
          <p className={`mt-0.5 text-xs ${muted}`}>{loading ? "Préparation de la voix…" : duration ? `${clock(duration)} · Voix française Google` : "Lecture audio · Synthèse vocale"}</p>
        </div>
        <label className={`flex items-center gap-2 text-xs ${muted}`}>
          Voix
          <select
            value={voice}
            onChange={(event) => changeVoice(event.target.value as "male" | "female")}
            className={`rounded-lg border px-2 py-1.5 text-xs outline-none ${light ? "border-slate-900/15 bg-white/70 text-slate-900" : "border-white/10 bg-zinc-900 text-zinc-100"}`}
          >
            <option value="male">Masculine</option>
            <option value="female">Féminine</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className={`w-9 text-right text-[11px] tabular-nums ${muted}`}>{clock(current)}</span>
        <input
          aria-label="Progression de la lecture"
          type="range"
          min={0}
          max={Math.max(duration, 0)}
          step={0.1}
          value={Math.min(current, duration || current)}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = value;
            setCurrent(value);
          }}
          className="h-1.5 min-w-0 flex-1 cursor-pointer accent-cyan-400"
        />
        <span className={`w-9 text-[11px] tabular-nums ${muted}`}>{clock(duration)}</span>
        <label className={`flex items-center gap-1 text-xs ${muted}`}>
          <span className="sr-only">Vitesse</span>
          <select
            aria-label="Vitesse de lecture"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            className={`rounded-lg border px-1.5 py-1 text-xs outline-none ${light ? "border-slate-900/15 bg-white/70 text-slate-900" : "border-white/10 bg-zinc-900 text-zinc-100"}`}
          >
            <option value={0.75}>0,75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1,25×</option>
            <option value={1.5}>1,5×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
      {error ? <p role="alert" className={`mt-3 text-xs ${light ? "text-red-700" : "text-red-300"}`}>{error}</p> : null}
    </section>
  );
}

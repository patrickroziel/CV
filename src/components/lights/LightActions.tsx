"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { ShareButton } from "@/components/medias/PostActions";

type LikeState = { available?: boolean; count?: number; liked?: boolean };
type PublicComment = { id: string; name: string; body: string; createdAt: string };

export function LightActions({
  reactId,
  shareUrl,
  title,
  text,
}: {
  reactId: string | null;
  shareUrl: string;
  title: string;
  text: string;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(Boolean(reactId));
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!reactId) return;
    let active = true;
    fetch(`/api/notes/${encodeURIComponent(reactId)}/likes`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<LikeState> : Promise.reject())
      .then((state) => {
        if (!active) return;
        setEnabled(state.available !== false);
        setLiked(state.liked === true);
        setCount(Number(state.count) || 0);
      })
      .catch(() => { if (active) setEnabled(false); });
    return () => { active = false; };
  }, [reactId]);

  useEffect(() => {
    if (!reactId || !open) return;
    let active = true;
    fetch(`/api/notes/${encodeURIComponent(reactId)}/comments`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ comments?: PublicComment[] }> : { comments: [] })
      .then((result) => { if (active) setComments(result.comments ?? []); })
      .catch(() => { if (active) setComments([]); });
    return () => { active = false; };
  }, [reactId, open]);

  async function react() {
    if (!reactId || !enabled || busy) return;
    setBusy(true);
    setNote("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(reactId)}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !liked }),
      });
      if (!response.ok) throw new Error();
      const state = await response.json() as LikeState;
      setLiked(state.liked === true);
      setCount(Number(state.count) || 0);
    } catch {
      setNote("Like indisponible.");
    } finally {
      setBusy(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reactId) return;
    const trap = String(new FormData(event.currentTarget).get("website") || "");
    setBusy(true);
    setNote("");
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(reactId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, body, website: trap }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Envoi impossible.");
      setBody("");
      setNote("Message reçu. Il sera visible après validation.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <ShareButton url={shareUrl} title={title} summary={text} />
        {reactId && (
          <>
            <button
              type="button"
              onClick={() => void react()}
              disabled={!enabled || busy}
              aria-pressed={liked}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan-100 disabled:opacity-40"
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
              J’aime{count > 0 ? ` · ${count}` : ""}
            </button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Commenter{comments.length > 0 ? ` · ${comments.length}` : ""}
            </button>
          </>
        )}
      </div>
      {open && reactId && (
        <div className="mt-3">
          {comments.length > 0 && (
            <ul className="mb-3 space-y-2">
              {comments.map((comment) => (
                <li key={comment.id} className="text-sm leading-relaxed text-zinc-300">
                  <span className="text-white">{comment.name}</span> — {comment.body}
                </li>
              ))}
            </ul>
          )}
          <form className="grid gap-2" onSubmit={(event) => void send(event)}>
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Prénom ou pseudo"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder="Un commentaire"
              className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none"
            />
            <button type="submit" disabled={busy} className="w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50">
              Envoyer
            </button>
          </form>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-cyan-100/80">{note}</p>}
    </div>
  );
}

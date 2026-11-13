"use client";
import { useEffect, useRef, useState } from "react";

type PortfolioCloudState = {
  data: Record<string, unknown>;
  revision: number;
  initialized: boolean;
  storage?: "neon" | "blob" | "snapshot";
};

type ModerationComment = {
  id: string;
  postId: string;
  postTitle: string;
  name: string;
  body: string;
  status: "pending" | "approved";
  createdAt: string;
};

export function BackofficeHome({ authenticated, privatePath }: { authenticated: boolean; privatePath: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [logoutError, setLogoutError] = useState(false);
  const [blobNote, setBlobNote] = useState("");
  const [storageNote, setStorageNote] = useState("");
  const [pending, setPending] = useState<ModerationComment[]>([]);
  const [approved, setApproved] = useState<ModerationComment[]>([]);

  async function loadComments() {
    const response = await fetch("/api/backoffice/comments", { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json() as { pending?: ModerationComment[]; approved?: ModerationComment[] };
    setPending(result.pending ?? []);
    setApproved(result.approved ?? []);
  }

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    fetch("/api/backoffice/content", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<PortfolioCloudState> : null)
      .then((state) => {
        if (!active || !state) return;
        setStorageNote(state.storage === "neon"
          ? ""
          : "Neon est en pause. Tu peux quand même modifier le site : ouvre Notes ou Work, puis « Modifier ». Tes textes restent enregistrés.");
      })
      .catch(() => { if (active) setStorageNote("Le contenu met un peu de temps à répondre. Réessaie dans un instant."); });
    void loadComments();
    return () => { active = false; };
  }, [authenticated]);

  async function moveBlobToCloudflare() {
    setBusy(true);
    setBlobNote("Transfert des médias encore chez Vercel…");
    const skip: string[] = [];
    let moved = 0;
    let failed = 0;
    let lastError = "";
    try {
      for (let step = 0; step < 80; step += 1) {
        const response = await fetch("/api/r2/migrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase: "content", skip }),
        });
        const result = (await response.json().catch(() => ({}))) as { done?: boolean; remaining?: number; error?: string; copied?: string; failed?: string };
        if (!response.ok) throw new Error(result.error || "Transfert refusé.");
        if (result.failed) {
          skip.push(result.failed);
          failed += 1;
          lastError = result.error || "erreur";
          setBlobNote(`${moved} copié(s), ${failed} laissé(s) : ${lastError}`);
          continue;
        }
        if (result.done || result.remaining === 0) {
          if (moved && !failed) setBlobNote(`${moved} média(s) sont sur Cloudflare.`);
          else if (failed) setBlobNote(`${moved} copié(s), ${failed} refusé(s). ${lastError}`);
          else setBlobNote("Aucun média Blob dans le contenu.");
          return;
        }
        if (result.copied) {
          moved += 1;
          setBlobNote(`${moved} copié(s), encore ${result.remaining ?? "…"}.`);
        }
      }
      setBlobNote(`${moved} copié(s), ${failed} laissé(s). Relance pour la suite.`);
    } catch (error) {
      setBlobNote(error instanceof Error ? error.message : "Transfert impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function currentCloud(): Promise<PortfolioCloudState> {
    const response = await fetch("/api/backoffice/content", { cache: "no-store" });
    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(detail.error || "Contenu indisponible.");
    }
    return response.json() as Promise<PortfolioCloudState>;
  }

  function download(data: Record<string, unknown>, prefix: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${prefix}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  async function exportCloud() {
    setBusy(true); setMessage("");
    try {
      const state = await currentCloud();
      download(state.data, "portfolio-cloud-backup");
      setMessage("Sauvegarde JSON téléchargée. Garde une copie dans iCloud Drive.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export impossible."); }
    finally { setBusy(false); }
  }

  async function initializeFromPublishedContent() {
    setBusy(true); setMessage("");
    try {
      const cloud = await currentCloud();
      if (cloud.initialized) {
        setMessage("Le site a déjà un contenu enregistré. Rien n'a été remplacé.");
        return;
      }
      if (!window.confirm(
        "Enregistrer le contenu déjà publié sur le site ? Les brouillons uniquement stockés sur ton iMac ne sont pas inclus."
      )) {
        setMessage("Annulé. Rien n'a changé.");
        return;
      }
      download(cloud.data, "portfolio-before-cloud-setup");
      const response = await fetch("/api/backoffice/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: cloud.data, expectedRevision: cloud.revision }),
      });
      if (!response.ok) {
        const details = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(details.error || "Enregistrement refusé.");
      }
      setMessage("Contenu enregistré. Ouvre Work ou Notes, puis « Modifier ».");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally { setBusy(false); }
  }

  async function importSnapshot(file: File) {
    setBusy(true); setMessage("");
    try {
      if (file.size > 3_000_000) throw new Error("Le fichier est trop volumineux.");
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      if (!data.profile || !Array.isArray(data.experiences) || !Array.isArray(data.projects) ||
          !Array.isArray(data.skills) || !Array.isArray(data.languages) || !Array.isArray(data.socialPosts)) {
        throw new Error("Fichier JSON non reconnu : aucun contenu modifié.");
      }
      const cloud = await currentCloud();
      if (cloud.initialized) {
        download(cloud.data, "portfolio-before-import");
        if (!window.confirm("Une sauvegarde vient d'être téléchargée. Remplacer tout le contenu par ce JSON ?")) {
          setMessage("Import annulé. Rien n'a été remplacé.");
          return;
        }
      }
      const response = await fetch("/api/backoffice/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, expectedRevision: cloud.revision }),
      });
      if (!response.ok) {
        const details = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(details.error || "Import impossible.");
      }
      setMessage("Import terminé. Ouvre Work ou Notes, puis « Modifier ».");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import impossible."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  async function decide(id: string, action: "approve" | "reject" | "delete") {
    setBusy(true);
    try {
      const response = await fetch("/api/backoffice/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Action impossible.");
      await loadComments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-20 mx-auto min-h-screen max-w-3xl overflow-x-hidden px-4 pb-16 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="rounded-3xl border border-cyan-200/20 bg-[#041820]/90 p-5 shadow-2xl backdrop-blur-2xl sm:p-8 md:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">Behind the Glass</p>
        <h1 className="mb-4 text-3xl font-semibold">Espace privé</h1>
        {!authenticated ? (
          <>
            <p className="mb-6 text-sm text-zinc-300">L'administration de ton portfolio est réservée à ton compte GitHub personnel.</p>
            <a href="/api/backoffice/login" className="inline-flex rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100">Connexion GitHub</a>
          </>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-cyan-100">Tu es connecté. Work et Notes n'ont pas changé d'adresse.</p>
            {storageNote && <p className="rounded-2xl border border-cyan-100/20 bg-cyan-100/5 px-4 py-3 text-sm text-cyan-50">{storageNote}</p>}
            <div className="flex flex-wrap gap-3">
              <a href="/" className="inline-flex min-h-11 items-center rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950">Modifier Work</a>
              <a href="/notes" className="inline-flex min-h-11 items-center rounded-xl border border-cyan-100/30 px-5 py-3 text-sm font-semibold">Gérer Notes</a>
              <a href="/g" className="inline-flex min-h-11 items-center rounded-xl border border-cyan-100/30 px-5 py-3 text-sm font-semibold">Pages fantômes</a>
            </div>
            <p className="text-xs text-zinc-400">Dans Work ou Notes, clique sur « Modifier » pour afficher les commandes d'édition.</p>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold">Commentaires</h2>
              <p className="mt-2 text-sm text-zinc-300">Rien n'apparaît sur le site tant que tu n'as pas cliqué sur Publier.</p>
              {pending.length === 0 ? <p className="mt-3 text-sm text-zinc-400">Aucun commentaire en attente.</p> : (
                <ul className="mt-3 space-y-3">
                  {pending.map((comment) => (
                    <li key={comment.id} className="rounded-xl border border-white/10 px-3 py-3 text-sm">
                      <p className="text-xs text-zinc-400">{comment.postTitle} · {comment.name}</p>
                      <p className="mt-1 whitespace-pre-wrap text-zinc-100">{comment.body}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => void decide(comment.id, "approve")} className="min-h-11 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">Publier</button>
                        <button type="button" disabled={busy} onClick={() => void decide(comment.id, "reject")} className="min-h-11 rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-50">Refuser</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {approved.length > 0 && <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
                {approved.map((comment) => (
                  <li key={comment.id} className="flex items-start justify-between gap-3 text-xs text-zinc-400">
                    <span className="min-w-0 break-words"><span className="text-zinc-200">{comment.name}</span> — {comment.body}</span>
                    <button type="button" disabled={busy} onClick={() => void decide(comment.id, "delete")} className="min-h-11 shrink-0 underline disabled:opacity-50">Retirer</button>
                  </li>
                ))}
              </ul>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold">Sauvegardes</h2>
              <p className="mt-2 text-sm text-zinc-300">Télécharge une copie, ou importe un ancien fichier JSON de ton iMac si tu en as un plus complet.</p>
              <button type="button" disabled={busy} onClick={() => void initializeFromPublishedContent()}
                className="mt-4 block w-full rounded-xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
                Enregistrer le contenu actuellement en ligne
              </button>
              <button disabled={busy} onClick={() => void exportCloud()}
                className="mt-4 rounded-xl border border-white/25 px-4 py-2 text-sm disabled:opacity-50">Télécharger une sauvegarde</button>
              <label htmlFor="portfolio-json" className="mt-5 block text-sm font-medium">Importer un export JSON</label>
              <input id="portfolio-json" ref={input} type="file" accept=".json,application/json" disabled={busy}
                className="mt-2 block w-full max-w-full text-sm disabled:opacity-50"
                onChange={(e) => { const selected = e.target.files?.[0]; if (selected) void importSnapshot(selected); }} />
              {busy && <p role="status" className="mt-3 text-sm text-zinc-300">Opération en cours…</p>}
              {message && <p role="status" className="mt-3 text-sm text-cyan-100">{message}</p>}
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold">Médias Vercel vers Cloudflare</h2>
              <p className="mt-2 text-sm text-zinc-300">Copie les images encore liées au contenu, une par une, vers Cloudflare. Les fichiers orphelins du stockage restent chez Vercel tant que tu ne les supprimes pas.</p>
              <button type="button" disabled={busy} onClick={() => void moveBlobToCloudflare()}
                className="mt-4 rounded-xl bg-cyan-200 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
                Transférer les médias du site
              </button>
              {blobNote && <p role="status" className="mt-3 text-sm text-cyan-100">{blobNote}</p>}
            </section>
            <button className="text-xs text-zinc-400 underline" onClick={async () => {
              setLogoutError(false);
              try {
                const response = await fetch("/api/backoffice/logout", { method: "POST" });
                if (!response.ok) throw new Error();
                window.location.assign(privatePath);
              } catch { setLogoutError(true); }
            }}>Se déconnecter</button>
            {logoutError && <p role="alert" className="text-xs text-red-300">Déconnexion impossible. Réessaie.</p>}
          </div>
        )}
      </div>
    </main>
  );
}

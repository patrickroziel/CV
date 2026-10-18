"use client";
import { useRef, useState } from "react";

type PortfolioCloudState = {
  data: Record<string, unknown>;
  revision: number;
  initialized: boolean;
};

export function BackofficeHome({ authenticated, privatePath }: { authenticated: boolean; privatePath: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [logoutError, setLogoutError] = useState(false);

  async function currentCloud(): Promise<PortfolioCloudState> {
    const response = await fetch("/api/backoffice/content", { cache: "no-store" });
    if (!response.ok) {
      const detail = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(detail.error || "Connexion à la base de données impossible.");
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
    URL.revokeObjectURL(href);
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
        // Export the old state before replacement, even if the import is cancelled.
        download(cloud.data, "portfolio-before-import");
        if (!window.confirm("Une sauvegarde cloud vient d'être téléchargée. Confirmer le remplacement de toutes les données cloud par ce JSON ?")) {
          setMessage("Import annulé. Aucune donnée remplacée.");
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
      setMessage("Import terminé. Tu peux maintenant ouvrir Work ou Notes et activer Modifier.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import impossible."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  return (
    <main className="relative z-20 mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 text-white">
      <div className="rounded-3xl border border-cyan-200/20 bg-[#041820]/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">Behind the Glass</p>
        <h1 className="mb-4 text-3xl font-semibold">Espace privé</h1>
        {!authenticated ? (
          <>
            <p className="mb-6 text-sm text-zinc-300">L'administration de ton portfolio est réservée à ton compte GitHub personnel.</p>
            <a href="/api/backoffice/login" className="inline-flex rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100">Connexion GitHub</a>
          </>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-cyan-100">Session administrateur active. Ton interface Work et Notes reste inchangée.</p>
            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950">Modifier Work</a>
              <a href="/notes" className="rounded-xl border border-cyan-100/30 px-5 py-3 text-sm font-semibold">Gérer Notes</a>
            </div>
            <p className="text-xs text-zinc-400">Dans Work ou Notes, clique sur « Modifier » pour afficher les commandes d'édition.</p>
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-semibold">Contenu et sauvegardes</h2>
              <p className="mt-2 text-sm text-zinc-300">Au premier démarrage, importe ton dernier Export JSON de l’iMac. Pour protéger les publications déjà en ligne, les exports trop anciens seront refusés. Conserve la sauvegarde dans iCloud Drive.</p>
              <button disabled={busy} onClick={() => void exportCloud()}
                className="mt-4 rounded-xl border border-white/25 px-4 py-2 text-sm disabled:opacity-50">Télécharger une sauvegarde cloud</button>
              <label htmlFor="portfolio-json" className="mt-5 block text-sm font-medium">Importer un export JSON existant</label>
              <input id="portfolio-json" ref={input} type="file" accept=".json,application/json" disabled={busy}
                className="mt-2 block w-full text-sm disabled:opacity-50"
                onChange={(e) => { const selected = e.target.files?.[0]; if (selected) void importSnapshot(selected); }} />
              {busy && <p role="status" className="mt-3 text-sm text-zinc-300">Opération en cours…</p>}
              {message && <p role="status" className="mt-3 text-sm text-cyan-100">{message}</p>}
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

"use client";

import Link from "next/link";
import { useState } from "react";

export function BackofficeHome({ authenticated, privatePath }: { authenticated: boolean; privatePath: string }) {
  const [logoutError, setLogoutError] = useState(false);
  return (
    <main className="relative z-20 mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-32 text-white">
      <div className="rounded-3xl border border-cyan-200/20 bg-[#041820]/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-200/70">Behind the Glass</p>
        <h1 className="mb-4 text-3xl font-semibold">Espace privé</h1>
        {!authenticated ? (
          <>
            <p className="mb-6 text-sm text-zinc-300">Connecte-toi avec ton compte GitHub pour accéder à ton espace personnel.</p>
            <a href="/api/backoffice/login" className="inline-flex rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-100">Se connecter avec GitHub</a>
          </>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-cyan-100">Connexion administrateur confirmée.</p>
            <p className="text-sm text-zinc-300">Ton interface Work et Notes actuelle est conservée. La synchronisation cloud sera activée lors de la prochaine étape de développement, après configuration de la base de données.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950">Voir Work</Link>
              <Link href="/notes" className="rounded-xl border border-cyan-100/30 px-5 py-3 text-sm font-semibold">Voir Notes</Link>
            </div>
            <button className="text-xs text-zinc-400 underline" onClick={async () => {
              setLogoutError(false);
              try {
                const result = await fetch("/api/backoffice/logout", { method: "POST" });
                if (!result.ok) throw new Error("logout");
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

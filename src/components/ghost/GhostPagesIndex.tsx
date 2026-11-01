"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { ghostExcerpt } from "@/lib/ghost-pages";
import { createId } from "@/lib/utils";
import type { GhostPage } from "@/lib/types";

function freshSlug(pages: GhostPage[]) {
  const used = new Set(pages.map((page) => page.slug));
  let slug = "";
  do {
    slug = `page-${Math.random().toString(36).slice(2, 7)}`;
  } while (used.has(slug));
  return slug;
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function GhostPagesIndex() {
  const { data, isHydrated, editAllowed, addGhostPage, setEditMode, showToast } = usePortfolio();
  const router = useRouter();
  const pages = [...(data.ghostPages ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const create = () => {
    const page: GhostPage = {
      id: createId(),
      slug: freshSlug(pages),
      title: "",
      body: "",
      visible: false,
      updatedAt: new Date().toISOString(),
    };
    addGhostPage(page);
    setEditMode(true);
    router.push(`/g/${page.slug}`);
  };

  const open = (slug: string) => {
    setEditMode(true);
    router.push(`/g/${slug}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-24 pt-28 text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/70">Back-office</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pages fantômes</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Toutes tes pages, les plus récentes en premier. Elles ne sont pas dans le menu du site.
          </p>
        </div>
        {editAllowed && (
          <Button onClick={create}>Nouvelle page</Button>
        )}
      </div>

      {!isHydrated && <p className="mt-10 text-sm text-zinc-400">Chargement…</p>}

      {isHydrated && !editAllowed && (
        <p className="mt-10 text-sm text-zinc-300">
          Cette liste est réservée à ton espace privé. Ouvre le back-office, puis reviens ici.
        </p>
      )}

      {isHydrated && editAllowed && pages.length === 0 && (
        <p className="mt-10 text-sm text-zinc-400">Aucune page fantôme pour le moment.</p>
      )}

      {isHydrated && editAllowed && pages.length > 0 && (
        <ol className="mt-8 grid gap-3">
          {pages.map((page) => (
            <li key={page.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{page.title.trim() || "Sans titre"}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">patrickroziel.com/g/{page.slug}</p>
                  <p className="mt-2 text-sm text-zinc-400">{ghostExcerpt(page.body, 140) || "Texte encore vide."}</p>
                  <p className="mt-2 text-xs text-zinc-500">Modifiée le {when(page.updatedAt)}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                  {page.visible ? "En ligne" : "Brouillon"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => open(page.slug)}>Ouvrir</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    const url = `https://patrickroziel.com/g/${page.slug}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      showToast("Lien copié");
                    } catch {
                      showToast(url);
                    }
                  }}
                >
                  Copier le lien
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

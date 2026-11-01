"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ghost, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
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

export function GhostPagesButton() {
  const { data, addGhostPage, setEditMode } = usePortfolio();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
    router.push(`/g/${page.slug}`);
  };

  return (
    <>
      <Button variant="ghost" size="sm" title="Créer une page fantôme" onClick={() => setOpen(true)}>
        <Ghost className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Fantôme</span>
      </Button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="grid max-h-[80vh] w-full max-w-lg gap-4 overflow-auto rounded-3xl border border-white/15 bg-[#071018]/95 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Hors menu</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Pages fantômes</h2>
                <p className="mt-1 text-sm text-zinc-400">Une page seule, avec son lien. Rien dans la navigation du site.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Fermer</Button>
            </div>
            <Button onClick={create} className="justify-center">
              <Plus className="h-4 w-4" />
              Nouvelle page
            </Button>
            <ul className="grid gap-2">
              {pages.length === 0 && <li className="text-sm text-zinc-500">Aucune page pour le moment.</li>}
              {pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.06]"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/g/${page.slug}`);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-100">{page.title.trim() || "Sans titre"}</span>
                      <span className="block truncate text-xs text-zinc-500">/g/{page.slug}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {page.visible ? "En ligne" : "Brouillon"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

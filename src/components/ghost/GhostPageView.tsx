"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { RichHtml } from "@/components/shared/RichHtml";
import { SiteTranslator } from "@/components/translation/SiteTranslator";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isGhostSlug, slugifyGhost } from "@/lib/ghost-pages";
import { ContactButton } from "@/components/layout/ContactButton";

export function GhostPageView({ slug }: { slug: string }) {
  const { data, isHydrated, editMode, l, updateGhostPage, removeGhostPage, showToast } = usePortfolio();
  const router = useRouter();
  const page = (data.ghostPages ?? []).find((item) => item.slug === slug);
  const [title, setTitle] = useState(page?.title ?? "");
  const [slugDraft, setSlugDraft] = useState(slug);

  useEffect(() => {
    setTitle(page?.title ?? "");
    setSlugDraft(page?.slug ?? slug);
  }, [page?.id, page?.title, page?.slug, slug]);

  if (!isHydrated) {
    return <GhostShell><p className="text-sm text-zinc-400">Chargement…</p></GhostShell>;
  }
  if (!page || (!page.visible && !editMode)) {
    return (
      <GhostShell>
        <p className="text-lg text-zinc-200">Cette page n’est pas disponible.</p>
      </GhostShell>
    );
  }

  const saveSlug = () => {
    const next = slugifyGhost(slugDraft);
    if (!isGhostSlug(next)) {
      showToast("Adresse invalide");
      setSlugDraft(page.slug);
      return;
    }
    if (next !== page.slug && (data.ghostPages ?? []).some((item) => item.slug === next)) {
      showToast("Cette adresse est déjà utilisée");
      setSlugDraft(page.slug);
      return;
    }
    if (next !== page.slug) {
      updateGhostPage(page.id, { slug: next });
      router.replace(`/g/${next}`);
    }
  };

  return (
    <GhostShell edit={editMode}>
      {editMode ? (
        <div className="grid gap-5 rounded-3xl border border-white/12 bg-black/45 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80">Page fantôme</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={page.visible ? "secondary" : "default"}
                onClick={() => updateGhostPage(page.id, { visible: !page.visible }, page.visible ? "Page masquée" : "Page publiée")}
              >
                {page.visible ? "Masquer" : "Publier"}
              </Button>
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
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!window.confirm("Supprimer cette page fantôme ?")) return;
                  removeGhostPage(page.id);
                  router.push("/");
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Titre
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                if (title !== page.title) updateGhostPage(page.id, { title: title.slice(0, 180) });
              }}
              placeholder="Le mot, ou le titre de la page"
              className="h-12 rounded-2xl border border-white/15 bg-black/40 px-3 text-lg font-semibold normal-case tracking-normal text-white outline-none focus:border-cyan-200/50"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Adresse
            <span className="flex h-10 items-center rounded-xl border border-white/10 bg-black/30 px-2 text-sm font-normal normal-case tracking-normal text-zinc-300">
              <span className="text-zinc-500">patrickroziel.com/g/</span>
              <input
                value={slugDraft}
                onChange={(event) => setSlugDraft(event.target.value)}
                onBlur={saveSlug}
                className="min-w-0 flex-1 bg-transparent text-zinc-100 outline-none"
              />
            </span>
          </label>
          <RichLocalizedField
            id="ghost-body"
            label="Texte"
            rows={14}
            value={page.body}
            placeholder="Écris la page. Le début de ce texte apparaîtra dans l’aperçu du lien."
            onChange={(next) => updateGhostPage(page.id, { body: next })}
          />
          {!page.visible && (
            <p className="text-sm text-amber-100/80">Brouillon : le lien ne montre rien tant que la page n’est pas publiée.</p>
          )}
        </div>
      ) : (
        <article>
          <div className="ghost-translate">
            <SiteTranslator tone="ghost" />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/75">Patrick Roziel</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            {page.title.trim() || "Sans titre"}
          </h1>
          <RichHtml html={l(page.body)} className="ghost-reading mt-8 text-lg leading-8 text-zinc-100" />
          <div className="mt-14">
            <ContactButton />
          </div>
        </article>
      )}
    </GhostShell>
  );
}

function GhostShell({ children, edit = false }: { children: React.ReactNode; edit?: boolean }) {
  return (
    <div className="ghost-page relative min-h-screen">
      <div className="ghost-page-sky" aria-hidden />
      <div className={`relative z-10 mx-auto w-full max-w-2xl px-5 pb-24 ${edit ? "pt-28 sm:pt-32" : "pt-16 sm:pt-24"}`}>{children}</div>
    </div>
  );
}

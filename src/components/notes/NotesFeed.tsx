"use client";

import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { BookOpen, Eye, Library, Music, PenLine, Plus, Sparkles, UserRound } from "lucide-react";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { UniversesWidget } from "@/components/notes/UniversesWidget";
import { AirTagTicker } from "@/components/air/AirTagTicker";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { SocialPostCard } from "@/components/medias/SocialPostCard";
import {
  SocialPostForm,
  type SocialPostFormValues,
} from "@/components/medias/SocialPostForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SocialPost } from "@/lib/types";
import { displayImageUrl } from "@/lib/display-image";
import { visibleCoverUrl } from "@/lib/post-publication";
import { NOTES_CATEGORIES, coercePostCategory, collectPostTags, type NotesCategory } from "@/lib/post-taxonomy";
import { compareBookChapters } from "@/lib/book-order";

type Scope = "Tout" | NotesCategory;

const FILTERS: Array<{ id: NotesCategory; icon: typeof BookOpen }> = [
  { id: "Livre", icon: BookOpen },
  { id: "Musique", icon: Music },
  { id: "Essais", icon: PenLine },
  { id: "Réflexion humaine", icon: UserRound },
  { id: "Spiritualité", icon: Sparkles },
  { id: "Symbolisme", icon: Eye },
  { id: "Fictions", icon: Library },
];

function categoryOf(post: SocialPost): NotesCategory {
  const category = coercePostCategory(post);
  return NOTES_CATEGORIES.includes(category as NotesCategory) ? category as NotesCategory : "Essais";
}

export function NotesFeed({ seedPosts = [] }: { seedPosts?: SocialPost[] }) {
  const {
    data,
    editMode,
    l,
    addSocialPost,
    updateSocialPost,
    isHydrated,
  } = usePortfolio();

  const [scope, setScope] = useState<Scope>("Tout");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [bookMenuOpen, setBookMenuOpen] = useState(false);

  const posts = useMemo(() => {
    const source = !isHydrated && seedPosts.length ? seedPosts : (data.socialPosts ?? []);
    const list = [...source].filter(post => post.universe !== "air").sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (b.date || "").localeCompare(a.date || "");
    });
    return editMode ? list : list.filter((post) => post.visible !== false);
  }, [data.socialPosts, editMode, isHydrated, seedPosts]);

  const scopedPosts = useMemo(() => {
    const list = scope === "Tout" ? posts : posts.filter((post) => categoryOf(post) === scope);
    return scope === "Livre" ? [...list].sort(compareBookChapters) : list;
  }, [posts, scope]);
  const tags = useMemo(() => collectPostTags(scopedPosts), [scopedPosts]);
  const visiblePosts = useMemo(() => {
    if (!activeTag) return scopedPosts;
    return scopedPosts.filter((post) =>
      (post.tags ?? []).some((tag) => tag.toLowerCase() === activeTag.toLowerCase())
    );
  }, [scopedPosts, activeTag]);

  const pinnedPosts = useMemo(() => {
    return [...visiblePosts]
      .filter((post) => post.pinned)
      .sort((a, b) => (b.pinnedAt || "").localeCompare(a.pinnedAt || ""))
      .slice(0, 6);
  }, [visiblePosts]);

  const bookChapters = useMemo(
    () => posts.filter((post) => categoryOf(post) === "Livre").sort(compareBookChapters),
    [posts]
  );

  const count = (filter: Scope) =>
    filter === "Tout"
      ? posts.length
      : posts.filter((post) => categoryOf(post) === filter).length;

  const handleCreate = (values: SocialPostFormValues) => {
    addSocialPost({ ...values, order: 0 });
    setCreateOpen(false);
    setScope("Tout");
  };

  const handleUpdate = (values: SocialPostFormValues) => {
    if (!editing) return;
    updateSocialPost(editing.id, values);
    setEditing(null);
  };

  return (
    <div className="mx-auto grid min-w-0 max-w-[1180px] gap-4 px-3 pb-24 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-10 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
      <aside className="min-w-0">
        <div className="universe-rail">
          <SectionHeading title="Notes">
            Livre, musique, essais, réflexion humaine, spiritualité, symbolisme et fictions.
          </SectionHeading>

          <UniversesWidget current="notes" />
        </div>
        <div className="mt-3" onMouseLeave={() => setBookMenuOpen(false)}>
          <nav aria-label="Catégories" className="section-menu-bar">
            {FILTERS.map((item) => {
              const active = item.id === scope;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setScope(active ? "Tout" : item.id);
                    setActiveTag(null);
                  }}
                  onMouseEnter={() => setBookMenuOpen(item.id === "Livre")}
                  onFocus={() => setBookMenuOpen(item.id === "Livre")}
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                    active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span>{item.id}</span>
                  <span className="text-[11px] tabular-nums text-white/40">{count(item.id)}</span>
                </button>
              );
            })}
          </nav>
          {bookMenuOpen && bookChapters.length > 0 ? (
            <div className="mt-2 flex gap-1 overflow-x-auto px-1">
              {bookChapters.map((chapter) => {
                const chapterTitle = l(chapter.title).trim() || "Brouillon sans titre";
                return (
                  <Link
                    key={chapter.id}
                    href={`/notes/${chapter.id}`}
                    className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75 hover:text-white"
                  >
                    {chapterTitle}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </aside>

      <section className="min-w-0">
        {pinnedPosts.length > 0 ? (
          <div className="mb-7">
            <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">Posts épinglés</p>
            <div className="grid grid-cols-2 gap-2">
              {pinnedPosts.map((post) => {
                const title = l(post.title).trim() || "Sans titre";
                const subtitle = post.subtitle ? l(post.subtitle).trim() : "";
                const visual = visibleCoverUrl(post)
                  || (post.featuredEmbed?.type === "image" ? post.featuredEmbed.url : null)
                  || (post.fileKind === "image" ? post.fileUrl : null);
                return (
                  <Link key={post.id} href={`/notes/${post.id}`} className="flex aspect-square min-w-0 flex-col items-stretch gap-2 rounded-2xl border border-white/10 bg-[rgba(3,16,20,0.72)] p-2 shadow-xl backdrop-blur-xl transition hover:border-cyan-100/25 sm:aspect-auto sm:flex-row sm:items-center sm:gap-3">
                    <span className="relative h-16 w-full shrink-0 overflow-hidden rounded-xl bg-black/40 sm:h-14 sm:w-24">
                      {visual ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={displayImageUrl(visual, 256)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="flex min-h-0 min-w-0 flex-1 flex-col">
                      <span className="line-clamp-2 break-words text-xs font-semibold leading-4 text-white sm:text-sm sm:leading-5">{title}</span>
                      {subtitle ? <span className="mt-1 line-clamp-2 break-words text-[10px] leading-4 text-zinc-400 sm:line-clamp-3 sm:text-xs sm:leading-5">{subtitle}</span> : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : editMode ? (
          <p className="mb-7 text-xs text-zinc-500">Aucun post épinglé. Tu peux en épingler jusqu’à 6.</p>
        ) : null}
        <header className="mb-7 flex min-w-0 flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">
              Publications
            </p>
            <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {activeTag ? `#${activeTag}` : scope === "Tout" ? "Notes" : scope}
            </h2>
            {activeTag ? (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="mt-2 text-xs text-zinc-500 underline-offset-4 hover:text-zinc-200 hover:underline"
              >
                Effacer le filtre
              </button>
            ) : null}
          </div>

          {editMode && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/[0.07] px-4 py-2 text-sm text-cyan-50 transition hover:bg-cyan-100/[0.13]"
            >
              <Plus className="h-4 w-4" />
              Nouveau post
            </button>
          )}
        </header>

        {visiblePosts.length > 0 ? (
          <div className="space-y-5">
            {visiblePosts.map((post, index) => (
              <Fragment key={post.id}>
                <SocialPostCard
                  post={post}
                  index={index}
                  onEdit={setEditing}
                  onTagClick={(tag) => {
                    setActiveTag(tag);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-8 text-center backdrop-blur-xl sm:p-12">
            <p className="text-sm text-zinc-400">
              {editMode
                ? "Aucune publication ici. Utilise « Nouveau post » pour commencer."
                : "Aucune publication pour le moment."}
            </p>
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau post</DialogTitle>
          </DialogHeader>
          <SocialPostForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel="Publier"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le post</DialogTitle>
          </DialogHeader>
          {editing ? (
            <SocialPostForm
              key={editing.id}
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitLabel={editing.visible === false ? "Publier" : "Enregistrer"}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <AirTagTicker
        tags={tags}
        activeTag={activeTag}
        onClear={() => setActiveTag(null)}
        onToggle={(tag) => {
          setActiveTag((current) => current?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr") ? null : tag);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}

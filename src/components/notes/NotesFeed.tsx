"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Images, Plus, Video } from "lucide-react";
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
import type { NotesCategory, SocialPost } from "@/lib/types";

type Scope = "Tout" | NotesCategory;


const FILTERS: Array<{ id: Scope; icon?: typeof BookOpen }> = [
  { id: "Tout" },
  { id: "Livre", icon: BookOpen },
  { id: "Réflexions", icon: FileText },
  { id: "Documents", icon: FileText },
  { id: "Images", icon: Images },
  { id: "Vidéos", icon: Video },
];

function categoryOf(post: SocialPost): NotesCategory {
  if (post.category) return post.category;
  if (post.youtubeUrl) return "Vidéos";
  if (post.fileKind === "image") return "Images";
  if (post.fileKind === "pdf") return "Documents";
  return "Réflexions";
}

export function NotesFeed() {
  const {
    data,
    editMode,
    l,
    addSocialPost,
    updateSocialPost,
  } = usePortfolio();

  const [scope, setScope] = useState<Scope>("Tout");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [bookMenuOpen, setBookMenuOpen] = useState(false);

  const posts = useMemo(() => {
    const list = [...(data.socialPosts ?? [])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (b.date || "").localeCompare(a.date || "");
    });
    return editMode ? list : list.filter((post) => post.visible !== false);
  }, [data.socialPosts, editMode]);

  const visiblePosts = useMemo(() => {
    const scoped =
      scope === "Tout"
        ? posts
        : posts.filter((post) => categoryOf(post) === scope);
    if (!activeTag) return scoped;
    return scoped.filter((post) =>
      (post.tags ?? []).some((tag) => tag.toLowerCase() === activeTag.toLowerCase())
    );
  }, [posts, scope, activeTag]);

  const bookChapters = useMemo(
    () => posts.filter((post) => categoryOf(post) === "Livre"),
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
    <div className="mx-auto grid min-w-0 max-w-[1180px] gap-7 px-3 sm:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16 lg:px-8">
      <aside>
        <div className="lg:sticky lg:top-28">
          <p className="text-xs text-zinc-500">Patrick Roziel</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">
            Notes
          </h1>
          <p className="mt-2 max-w-[18rem] text-xs leading-5 text-zinc-500 lg:max-w-none">
            Livre, réflexions, documents, images et vidéos.
          </p>

          <p className="mb-3 mt-8 text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            Parcourir
          </p>

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
            {FILTERS.map((item) => {
              const active = item.id === scope;
              const Icon = item.icon;
              const button = (
                <button
                  type="button"
                  onClick={() => {
                    setScope(item.id);
                    setActiveTag(null);
                  }}
                  className={[
                    "group/filter flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-[background-color,border-color,color] duration-150 ease-out lg:w-full",
                    active
                      ? "border-cyan-100/[0.16] bg-cyan-100/[0.16] text-cyan-50"
                      : item.id === "Livre" && bookMenuOpen
                        ? "border-white/[0.10] bg-white/[0.09] text-zinc-100"
                        : "border-transparent text-zinc-500 hover:border-white/[0.10] hover:bg-white/[0.09] hover:text-zinc-100",
                  ].join(" ")}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
                    <span className="truncate">{item.id}</span>
                  </span>
                  <span
                    className={[
                      "text-[10px] transition-colors duration-150",
                      active
                        ? "text-cyan-100/55"
                        : "text-zinc-700 group-hover/filter:text-zinc-500",
                    ].join(" ")}
                  >
                    {count(item.id)}
                  </span>
                </button>
              );

              if (item.id !== "Livre") {
                return <div key={item.id} className="shrink-0 lg:w-full">{button}</div>;
              }

              return (
                <div
                  key={item.id}
                  className="shrink-0 lg:w-full"
                  onMouseEnter={() => setBookMenuOpen(true)}
                  onMouseLeave={() => setBookMenuOpen(false)}
                  onFocus={() => setBookMenuOpen(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setBookMenuOpen(false);
                    }
                  }}
                >
                  {button}

                  {bookChapters.length > 0 ? (
                    <div
                      className={`hidden overflow-hidden pl-2 transition-all duration-200 lg:block ${
                        bookMenuOpen
                          ? "max-h-[32rem] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="ml-2 border-l border-cyan-100/10 py-1 pl-2">
                        {bookChapters.map((chapter) => {
                          const chapterTitle = l(chapter.title).trim() || "Brouillon sans titre";
                          return (
                            <Link
                              key={chapter.id}
                              href={`/notes/${chapter.id}`}
                              className="block min-w-0 rounded-lg px-2 py-1.5 text-[0.68rem] leading-snug text-zinc-500 transition-[background-color,color] duration-150 hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:bg-white/[0.06] focus-visible:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                            >
                              <span className="block break-words">{chapterTitle}</span>
                              {editMode && !chapter.visible ? (
                                <span className="mt-0.5 block text-[9px] uppercase tracking-wide text-amber-200/70">
                                  Brouillon
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="mb-7 flex min-w-0 flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">
              Journal
            </p>
            <h2 className="mt-1 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {activeTag ? `#${activeTag}` : scope === "Tout" ? "Fil" : scope}
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
              <SocialPostCard
                key={post.id}
                post={post}
                index={index}
                onEdit={setEditing}
                onTagClick={(tag) => {
                  setActiveTag(tag);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
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
    </div>
  );
}

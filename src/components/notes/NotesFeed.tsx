"use client";

import { useMemo, useState } from "react";
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
    addSocialPost,
    updateSocialPost,
    reorderSocialPosts,
  } = usePortfolio();

  const [scope, setScope] = useState<Scope>("Tout");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);

  const posts = useMemo(() => {
    const list = [...(data.socialPosts ?? [])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (b.date || "").localeCompare(a.date || "");
    });
    return editMode ? list : list.filter((post) => post.visible !== false);
  }, [data.socialPosts, editMode]);

  const visiblePosts = useMemo(
    () =>
      scope === "Tout"
        ? posts
        : posts.filter((post) => categoryOf(post) === scope),
    [posts, scope]
  );

  const count = (filter: Scope) =>
    filter === "Tout"
      ? posts.length
      : posts.filter((post) => categoryOf(post) === filter).length;

  const handleMove = (id: string, dir: -1 | 1) => {
    const ids = posts.map((post) => post.id);
    const index = ids.indexOf(id);
    const nextIndex = index + dir;
    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
    const next = [...ids];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    reorderSocialPosts(next);
  };

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
    <div className="mx-auto grid max-w-[1180px] gap-8 px-5 sm:px-8 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-16">
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
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id)}
                  className={[
                    "flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition lg:w-full",
                    active
                      ? "bg-cyan-100/[0.09] text-cyan-50"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center gap-2">
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                    {item.id}
                  </span>
                  <span className="text-[10px] text-zinc-700">
                    {count(item.id)}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="mb-7 flex items-end justify-between gap-5 border-b border-white/[0.07] pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">
              Journal
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white">
              {scope === "Tout" ? "Fil" : scope}
            </h2>
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
                canMoveUp={index > 0}
                canMoveDown={index < visiblePosts.length - 1}
                onEdit={setEditing}
                onMove={handleMove}
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
              submitLabel="Enregistrer"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

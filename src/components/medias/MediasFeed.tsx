"use client";

import { useMemo, useState } from "react";
import { Plus, Radio } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { EditableSectionHeading } from "@/components/shared/EditableSectionHeading";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SocialPostCard } from "@/components/medias/SocialPostCard";
import { MediasSearchBar } from "@/components/medias/MediasSearchBar";
import {
  SocialPostForm,
  type SocialPostFormValues,
} from "@/components/medias/SocialPostForm";
import {
  postMatchesKind,
  postMatchesQuery,
  type MediasKindFilter,
} from "@/lib/medias-search";
import { DEFAULT_SOCIAL, type SocialPost } from "@/lib/types";

export function MediasFeed() {
  const {
    data,
    editMode,
    t,
    l,
    updateSocial,
    addSocialPost,
    updateSocialPost,
    reorderSocialPosts,
  } = usePortfolio();

  const social = data.social ?? DEFAULT_SOCIAL;
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MediasKindFilter>("all");

  const posts = useMemo(() => {
    const list = [...(data.socialPosts ?? [])].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (b.date || "").localeCompare(a.date || "");
    });
    if (editMode) return list;
    return list.filter((p) => p.visible !== false);
  }, [data.socialPosts, editMode]);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) => postMatchesKind(p, kind) && postMatchesQuery(p, query)
      ),
    [posts, kind, query]
  );

  const hasActiveSearch = Boolean(query.trim()) || kind !== "all";

  const clearSearch = () => {
    setQuery("");
    setKind("all");
  };

  const handleMove = (id: string, dir: -1 | 1) => {
    const ids = posts.map((p) => p.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const next = [...ids];
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    reorderSocialPosts(next);
  };

  const handleCreate = (values: SocialPostFormValues) => {
    addSocialPost({ ...values, order: 0 });
    setCreateOpen(false);
  };

  return (
    <section id="medias" className="relative z-10">
      <EditableSectionHeading
        eyebrow={social.eyebrow}
        eyebrowClassName="text-violet-300"
        onEyebrowChange={(eyebrow) => updateSocial({ eyebrow })}
        title={l(social.title).trim() || t("medias.title")}
        titleValue={social.title}
        onTitleChange={(title) => updateSocial({ title })}
        description={social.description}
        onDescriptionChange={(description) => updateSocial({ description })}
        descriptionFallback={t("medias.description")}
        action={
          <EditGate>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-violet-300 text-zinc-950 hover:bg-violet-200"
            >
              <Plus className="h-4 w-4" />
              {t("medias.add")}
            </Button>
          </EditGate>
        }
      />

      {posts.length > 0 && (
        <div className="mx-auto max-w-3xl">
          <MediasSearchBar
            query={query}
            onQueryChange={setQuery}
            kind={kind}
            onKindChange={setKind}
          />
        </div>
      )}

      {posts.length === 0 ? (
        <GlassCard className="border-violet-300/15 p-10 text-center sm:p-14">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-violet-400/15 text-violet-200">
              <Radio className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-400">
              {editMode ? t("medias.emptyEdit") : t("medias.empty")}
            </p>
            {editMode && (
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-violet-300 text-zinc-950 hover:bg-violet-200"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("medias.add")}
              </Button>
            )}
          </div>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="mx-auto max-w-3xl border-violet-300/15 p-10 text-center sm:p-12">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <p className="text-sm text-zinc-300">
              {query.trim()
                ? `${t("medias.searchEmptyFor")} « ${query.trim()} ».`
                : t("medias.searchEmpty")}
            </p>
            {hasActiveSearch && (
              <Button
                size="sm"
                variant="secondary"
                onClick={clearSearch}
              >
                {t("medias.searchClear")}
              </Button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-5 sm:gap-6">
          {filtered.map((post, i) => {
            const sourceIndex = posts.findIndex((p) => p.id === post.id);
            return (
              <SocialPostCard
                key={post.id}
                post={post}
                index={i}
                canMoveUp={sourceIndex > 0}
                canMoveDown={sourceIndex < posts.length - 1}
                onEdit={setEditing}
                onMove={handleMove}
                onTagClick={setQuery}
              />
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("medias.createTitle")}</DialogTitle>
          </DialogHeader>
          <SocialPostForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel={t("actions.add")}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("medias.editTitle")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <SocialPostForm
              initial={editing}
              onSubmit={(values) => {
                updateSocialPost(editing.id, values);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

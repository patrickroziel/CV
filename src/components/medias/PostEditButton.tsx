"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { SocialPostForm, type SocialPostFormValues } from "@/components/medias/SocialPostForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { SocialPost } from "@/lib/types";

export function PostEditButton({
  post,
  universe,
  tone = "dark",
}: {
  post: SocialPost;
  universe: "notes" | "air";
  tone?: "dark" | "light";
}) {
  const { editMode, updateSocialPost } = usePortfolio();
  const [open, setOpen] = useState(false);
  if (!editMode) return null;

  const save = (values: SocialPostFormValues) => {
    updateSocialPost(post.id, { ...values, universe });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={tone === "light"
          ? "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-900/15 bg-white/80 px-3 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white"
          : "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-cyan-100/20 bg-cyan-100/[0.07] px-3 text-xs font-semibold text-cyan-50 hover:bg-cyan-100/[0.14]"}
      >
        <Pencil className="h-3.5 w-3.5" />
        Modifier
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="form" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
          </DialogHeader>
          <SocialPostForm
            key={post.id + (open ? "-open" : "")}
            universe={universe}
            initial={post}
            onSubmit={save}
            onCancel={() => setOpen(false)}
            submitLabel="Enregistrer"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import type { NotesCategory, SocialPost, SocialPostFileKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  getL,
  liftToLocalized,
  type LocalizedString,
} from "@/lib/i18n-content";
import { MEDIA_FOLDERS, uploadToBlob } from "@/lib/blob-upload";
import { cn, isYoutubeUrl } from "@/lib/utils";

export type SocialPostFormValues = Omit<SocialPost, "id" | "order">;

type SocialPostFormProps = {
  initial?: Partial<SocialPost>;
  onSubmit: (values: SocialPostFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

const MAX_BYTES = 20 * 1024 * 1024;

const NOTES_CATEGORIES: NotesCategory[] = [
  "Livre",
  "Réflexions",
  "Documents",
  "Images",
  "Vidéos",
];

function detectFileKind(file: File): SocialPostFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) {
    return "image";
  }
  return null;
}

export function SocialPostForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: SocialPostFormProps) {
  const { t } = usePortfolio();
  const [title, setTitle] = useState<LocalizedString>(
    liftToLocalized(initial?.title)
  );
  const [description, setDescription] = useState<LocalizedString>(
    liftToLocalized(initial?.description)
  );
  const [date, setDate] = useState(
    initial?.date || new Date().toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<NotesCategory>(
    initial?.category ??
      (initial?.youtubeUrl
        ? "Vidéos"
        : initial?.fileKind === "image"
          ? "Images"
          : initial?.fileKind === "pdf"
            ? "Documents"
            : "Réflexions")
  );
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [fileUrl, setFileUrl] = useState<string | null>(initial?.fileUrl ?? null);
  const [fileKind, setFileKind] = useState<SocialPostFileKind | null>(
    initial?.fileKind ?? null
  );
  const [fileName, setFileName] = useState<string | null>(
    initial?.fileName ?? null
  );
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    const kind = detectFileKind(file);
    if (!kind) {
      setError(t("medias.fileHint"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Fichier trop lourd (max 20 Mo).");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadToBlob(file, {
        folder: MEDIA_FOLDERS.social,
        resourceType: kind === "pdf" ? "raw" : "image",
        onProgress: setProgress,
        signal: controller.signal,
      });
      setFileUrl(result.url);
      setFileKind(kind);
      setFileName(file.name);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(
        err instanceof Error ? err.message : "Échec de l’upload vers Vercel Blob."
      );
    } finally {
      setUploading(false);
      setProgress(0);
      abortRef.current = null;
    }
  }, [t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!getL(title).trim()) {
      setError(t("medias.titleRequired"));
      return;
    }
    const yt = youtubeUrl.trim();
    if (yt && !isYoutubeUrl(yt)) {
      setError(t("medias.invalidYoutube"));
      return;
    }
    onSubmit({
      title,
      description,
      date: date || new Date().toISOString().slice(0, 10),
      youtubeUrl: yt || null,
      fileUrl,
      fileKind: fileUrl ? fileKind : null,
      fileName: fileUrl ? fileName : null,
      category,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      visible,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <LocalizedField
        label={`${t("medias.titleField")} *`}
        value={title}
        onChange={setTitle}
        placeholder="Ex. Making-of, brief, note…"
      />
      <LocalizedField
        label={t("medias.descriptionField")}
        value={description}
        onChange={setDescription}
        multiline
        rows={4}
        placeholder="Texte du post…"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="notes-category">Catégorie</Label>
          <select
            id="notes-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as NotesCategory)}
            className="h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-300/40"
          >
            {NOTES_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="social-date">{t("medias.date")}</Label>
          <Input
            id="social-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/40 accent-cyan-300"
          />
          {t("medias.visible")}
        </label>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="social-tags">{t("medias.tagsField")}</Label>
        <Input
          id="social-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t("medias.tagsPlaceholder")}
        />
        <p className="text-[11px] text-zinc-500">{t("medias.tagsHint")}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="social-yt">{t("medias.youtubeUrl")}</Label>
        <Input
          id="social-yt"
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder={t("medias.youtubePlaceholder")}
        />
      </div>

      <div className="grid gap-2">
        <Label>{t("medias.fileLabel")}</Label>
        <p className="text-[11px] text-zinc-500">{t("medias.fileHint")}</p>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!uploading) inputRef.current?.click();
            }
          }}
          onClick={() => {
            if (!uploading) inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void processFile(file);
          }}
          className={cn(
            "relative flex min-h-[80px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-3 transition-colors",
            dragging
              ? "border-cyan-300/60 bg-cyan-300/10"
              : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
            fileUrl && "border-solid border-white/15",
            uploading && "pointer-events-none"
          )}
        >
          {fileUrl && !uploading ? (
            <div className="flex w-full items-center gap-2 pr-8 text-left">
              <FileUp className="h-5 w-5 shrink-0 text-cyan-200" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-zinc-200">
                  {fileName || fileUrl.split("/").pop()}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {fileKind === "image" ? t("medias.fileLabel") : "PDF"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center text-zinc-400">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-cyan-200/80" />
              ) : (
                <FileUp className="h-6 w-6 text-zinc-500" />
              )}
              <span className="text-xs">
                {uploading ? `Upload… ${progress}%` : t("medias.fileHint")}
              </span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40" aria-hidden>
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {fileUrl && !uploading && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-2 h-7 w-7 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setFileUrl(null);
                setFileKind(null);
                setFileName(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf,image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("actions.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={uploading}
          className="bg-cyan-200 text-zinc-950 hover:bg-cyan-100"
        >
          {submitLabel || t("actions.save")}
        </Button>
      </div>
    </form>
  );
}

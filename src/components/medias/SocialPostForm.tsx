"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import type { NotesCategory, SocialPost, SocialPostFileKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { getL, liftToLocalized, type LocalizedString } from "@/lib/i18n-content";
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
const NOTES_CATEGORIES: NotesCategory[] = ["Livre", "Réflexions", "Documents", "Images", "Vidéos"];

function detectFileKind(file: File): SocialPostFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) return "image";
  return null;
}

export function SocialPostForm({ initial, onSubmit, onCancel, submitLabel = "Enregistrer" }: SocialPostFormProps) {
  const [title, setTitle] = useState<LocalizedString>(liftToLocalized(initial?.title));
  const [description, setDescription] = useState<LocalizedString>(liftToLocalized(initial?.description));
  const [category, setCategory] = useState<NotesCategory>(
    initial?.category ?? (initial?.youtubeUrl ? "Vidéos" : initial?.fileKind === "image" ? "Images" : initial?.fileKind === "pdf" ? "Documents" : "Réflexions")
  );
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? "");
  const [fileUrl, setFileUrl] = useState<string | null>(initial?.fileUrl ?? null);
  const [fileKind, setFileKind] = useState<SocialPostFileKind | null>(initial?.fileKind ?? null);
  const [fileName, setFileName] = useState<string | null>(initial?.fileName ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    const kind = detectFileKind(file);
    if (!kind) return setError("Ajoute une image ou un PDF.");
    if (file.size > MAX_BYTES) return setError("Fichier trop lourd (max 20 Mo).");
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
      setError(err instanceof Error ? err.message : "Échec de l’upload.");
    } finally {
      setUploading(false);
      setProgress(0);
      abortRef.current = null;
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!getL(title, "fr").trim()) return setError("Le titre est obligatoire.");
    const yt = youtubeUrl.trim();
    if (yt && !isYoutubeUrl(yt)) return setError("Le lien YouTube n’est pas valide.");
    onSubmit({
      title,
      description,
      date: initial?.date || new Date().toISOString().slice(0, 10),
      youtubeUrl: yt || null,
      fileUrl,
      fileKind: fileUrl ? fileKind : null,
      fileName: fileUrl ? fileName : null,
      category,
      tags: initial?.tags ?? [],
      visible: initial?.visible ?? true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <LocalizedField label="Titre *" value={title} onChange={setTitle} placeholder="Titre du post" />
      <LocalizedField label="Texte" value={description} onChange={setDescription} multiline rows={7} placeholder="Écris ton post…" />

      <div className="grid gap-2">
        <Label htmlFor="notes-category">Catégorie</Label>
        <select
          id="notes-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as NotesCategory)}
          className="h-10 w-full rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-300/40"
        >
          {NOTES_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="social-yt">Vidéo YouTube (optionnel)</Label>
        <Input id="social-yt" type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/…" />
      </div>

      <div className="grid gap-2">
        <Label>Image ou PDF (optionnel)</Label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click();
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) void processFile(file); }}
          className={cn(
            "relative flex min-h-[76px] cursor-pointer items-center justify-center rounded-xl border border-dashed p-3 transition-colors",
            dragging ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
            fileUrl && "border-solid border-white/15"
          )}
        >
          {fileUrl && !uploading ? (
            <div className="flex w-full items-center gap-2 pr-8"><FileUp className="h-5 w-5 text-cyan-200" /><span className="truncate text-xs text-zinc-200">{fileName || "Fichier ajouté"}</span></div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-400">{uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}{uploading ? `Upload… ${progress}%` : "Clique ou glisse un fichier"}</div>
          )}
          {fileUrl && !uploading && (
            <Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2 h-7 w-7" onClick={(e) => { e.stopPropagation(); setFileUrl(null); setFileKind(null); setFileName(null); }}><X className="h-3.5 w-3.5" /></Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void processFile(file); e.target.value = ""; }} />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={uploading} className="bg-cyan-200 text-zinc-950 hover:bg-cyan-100">{submitLabel}</Button>
      </div>
    </form>
  );
}

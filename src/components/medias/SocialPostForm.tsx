"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpen, FileText, FileUp, ImageIcon, Loader2, Save, X } from "lucide-react";
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

type UploadTarget = "general" | "cover" | "bookPdf" | null;

function detectFileKind(file: File): SocialPostFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) return "image";
  return null;
}

function FilePicker({
  label,
  accept,
  value,
  fileName,
  uploading,
  progress,
  onPick,
  onClear,
  icon: Icon = FileUp,
}: {
  label: string;
  accept: string;
  value: string | null;
  fileName: string | null;
  uploading: boolean;
  progress: number;
  onPick: (file: File) => void;
  onClear: () => void;
  icon?: typeof FileUp;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid min-w-0 gap-2">
      <Label>{label}</Label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading) inputRef.current?.click();
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
          if (file) onPick(file);
        }}
        className={cn(
          "relative flex min-h-[74px] min-w-0 cursor-pointer items-center justify-center rounded-xl border border-dashed p-3 transition-colors",
          dragging
            ? "border-cyan-300/60 bg-cyan-300/10"
            : "border-white/20 bg-black/20 hover:border-white/35 hover:bg-white/5",
          value && "border-solid border-white/15"
        )}
      >
        {value && !uploading ? (
          <div className="flex min-w-0 w-full items-center gap-2 pr-8">
            <Icon className="h-5 w-5 shrink-0 text-cyan-200" />
            <span className="min-w-0 truncate text-xs text-zinc-200">{fileName || "Fichier ajouté"}</span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-400">
            {uploading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Icon className="h-5 w-5 shrink-0" />}
            <span className="min-w-0 break-words">{uploading ? `Upload… ${progress}%` : "Clique ou glisse un fichier"}</span>
          </div>
        )}
        {value && !uploading && (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function SocialPostForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: SocialPostFormProps) {
  const [title, setTitle] = useState<LocalizedString>(liftToLocalized(initial?.title));
  const [subtitle, setSubtitle] = useState<LocalizedString>(liftToLocalized(initial?.subtitle));
  const [description, setDescription] = useState<LocalizedString>(liftToLocalized(initial?.description));
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
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [fileUrl, setFileUrl] = useState<string | null>(initial?.fileUrl ?? null);
  const [fileKind, setFileKind] = useState<SocialPostFileKind | null>(initial?.fileKind ?? null);
  const [fileName, setFileName] = useState<string | null>(initial?.fileName ?? null);
  const [bookCoverUrl, setBookCoverUrl] = useState<string | null>(initial?.bookCoverUrl ?? null);
  const [bookCoverName, setBookCoverName] = useState<string | null>(initial?.bookCoverName ?? null);
  const [bookPdfUrl, setBookPdfUrl] = useState<string | null>(initial?.bookPdfUrl ?? null);
  const [bookPdfName, setBookPdfName] = useState<string | null>(initial?.bookPdfName ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const isBook = category === "Livre";

  const processFile = useCallback(async (file: File, target: Exclude<UploadTarget, null>) => {
    setError(null);
    const kind = detectFileKind(file);
    if (!kind) return setError("Ajoute une image ou un PDF.");
    if (target === "cover" && kind !== "image") return setError("La couverture doit être une image.");
    if (target === "bookPdf" && kind !== "pdf") return setError("Ajoute un fichier PDF pour le chapitre.");
    if (file.size > MAX_BYTES) return setError("Fichier trop lourd (max 20 Mo).");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setUploadTarget(target);
    setProgress(0);

    try {
      const result = await uploadToBlob(file, {
        folder: MEDIA_FOLDERS.social,
        resourceType: kind === "pdf" ? "raw" : "image",
        onProgress: setProgress,
        signal: controller.signal,
      });
      if (target === "cover") {
        setBookCoverUrl(result.url);
        setBookCoverName(file.name);
      } else if (target === "bookPdf") {
        setBookPdfUrl(result.url);
        setBookPdfName(file.name);
      } else {
        setFileUrl(result.url);
        setFileKind(kind);
        setFileName(file.name);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Échec de l’upload.");
    } finally {
      setUploadTarget(null);
      setProgress(0);
      abortRef.current = null;
    }
  }, []);

  const buildValues = (nextVisible: boolean): SocialPostFormValues => ({
    title,
    subtitle: getL(subtitle, "fr").trim() ? subtitle : undefined,
    description,
    date: initial?.date || new Date().toISOString().slice(0, 10),
    youtubeUrl: youtubeUrl.trim() || null,
    fileUrl,
    fileKind: fileUrl ? fileKind : null,
    fileName: fileUrl ? fileName : null,
    bookCoverUrl,
    bookCoverName,
    bookPdfUrl,
    bookPdfName,
    category,
    tags: Array.from(
      new Set(tagsText.split(",").map((tag) => tag.trim()).filter(Boolean))
    ),
    visible: nextVisible,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!getL(title, "fr").trim()) return setError("Le titre est obligatoire pour publier.");
    if (isBook && !getL(description, "fr").trim()) return setError("Ajoute le texte du chapitre avant de publier.");
    const yt = youtubeUrl.trim();
    if (yt && !isYoutubeUrl(yt)) return setError("Le lien YouTube n’est pas valide.");
    onSubmit(buildValues(true));
  };

  const handleSaveDraft = () => {
    setError(null);
    const hasSomething = Boolean(
      getL(title, "fr").trim() ||
        getL(subtitle, "fr").trim() ||
        getL(description, "fr").trim() ||
        youtubeUrl.trim() ||
        fileUrl ||
        bookCoverUrl ||
        bookPdfUrl
    );
    if (!hasSomething) {
      setError("Ajoute au moins un titre ou un contenu avant d’enregistrer le brouillon.");
      return;
    }
    onSubmit(buildValues(false));
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-5">
      <div className="grid gap-2">
        <Label htmlFor="notes-category">Catégorie</Label>
        <select
          id="notes-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as NotesCategory)}
          className="h-10 w-full min-w-0 rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-300/40"
        >
          {NOTES_CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {isBook && (
        <div className="rounded-2xl border border-cyan-200/12 bg-cyan-200/[0.035] p-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2 text-cyan-50">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Mode Livre</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Le texte est la version principale à lire sur le site. La couverture et le PDF sont facultatifs.
          </p>
        </div>
      )}

      <LocalizedField
        label={isBook ? "Titre du chapitre *" : "Titre *"}
        value={title}
        onChange={setTitle}
        placeholder={isBook ? "Ex. Chapitre 1 — Le départ" : "Titre du post"}
      />

      {isBook && (
        <LocalizedField
          label="Sous-titre (facultatif)"
          value={subtitle}
          onChange={setSubtitle}
          placeholder="Une phrase courte pour introduire le chapitre"
        />
      )}

      <LocalizedField
        label={isBook ? "Texte du chapitre *" : "Texte"}
        value={description}
        onChange={setDescription}
        multiline
        rows={isBook ? 14 : 7}
        placeholder={isBook ? "Colle ou écris le texte du chapitre ici…" : "Écris ton post…"}
      />

      <div className="grid gap-2">
        <Label htmlFor="notes-tags">Tags</Label>
        <Input
          id="notes-tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder={isBook ? "Australie, Départ, Identité" : "Musique, Alicia Keys, Chez-soi"}
        />
        <p className="text-xs leading-5 text-zinc-500">
          Sépare les tags par des virgules. Ils servent à regrouper et retrouver les publications.
        </p>
      </div>

      {isBook ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <FilePicker
            label="Image de couverture (facultatif)"
            accept="image/*"
            value={bookCoverUrl}
            fileName={bookCoverName}
            uploading={uploadTarget === "cover"}
            progress={progress}
            onPick={(file) => void processFile(file, "cover")}
            onClear={() => {
              setBookCoverUrl(null);
              setBookCoverName(null);
            }}
            icon={ImageIcon}
          />
          <FilePicker
            label="PDF du chapitre (facultatif)"
            accept="application/pdf,.pdf"
            value={bookPdfUrl}
            fileName={bookPdfName}
            uploading={uploadTarget === "bookPdf"}
            progress={progress}
            onPick={(file) => void processFile(file, "bookPdf")}
            onClear={() => {
              setBookPdfUrl(null);
              setBookPdfName(null);
            }}
            icon={FileText}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <Label htmlFor="social-yt">Vidéo YouTube (optionnel)</Label>
            <Input
              id="social-yt"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/…"
            />
          </div>

          <FilePicker
            label="Image ou PDF (optionnel)"
            accept="application/pdf,.pdf,image/*"
            value={fileUrl}
            fileName={fileName}
            uploading={uploadTarget === "general"}
            progress={progress}
            onPick={(file) => void processFile(file, "general")}
            onClear={() => {
              setFileUrl(null);
              setFileKind(null);
              setFileName(null);
            }}
          />
        </>
      )}

      {error && <p className="break-words text-xs text-red-400">{error}</p>}
      <div className="grid gap-2 pt-1 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button
          type="button"
          variant="secondary"
          disabled={uploadTarget !== null}
          onClick={handleSaveDraft}
          className="justify-center gap-2 sm:justify-self-end"
        >
          <Save className="h-4 w-4" />
          {initial?.visible === true ? "Passer en brouillon" : "Enregistrer le brouillon"}
        </Button>
        <Button
          type="submit"
          disabled={uploadTarget !== null}
          className="bg-cyan-200 text-zinc-950 hover:bg-cyan-100"
        >
          {submitLabel}
        </Button>
      </div>
      <p className="text-xs leading-5 text-zinc-500 sm:text-right">
        Les brouillons restent dans tes données et sont inclus dans l’Export JSON, mais ils ne sont pas visibles publiquement.
      </p>
    </form>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { BookOpen, FileText, FileUp, ImageIcon, Loader2, Plus, Save, X } from "lucide-react";
import type { NotesCategory, SocialPost, SocialPostFileKind, InlinePostMedia, FeaturedEmbed, MediaItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { MediaCarouselEditor } from "@/components/shared/MediaCarouselEditor";
import { stripHtml } from "@/lib/sanitize-html";
import { getL, liftToLocalized, setL, type LocalizedString } from "@/lib/i18n-content";
import { MEDIA_FOLDERS, uploadToBlob } from "@/lib/blob-upload";
import { cn } from "@/lib/utils";
import { featuredEmbedFromInput, normalizeFeaturedEmbed } from "@/lib/featured-embed";
import { mediaMarker, removeInlineMediaMarker, normalizeInlinePostMedia, normalizeInlineCarouselItems } from "@/lib/post-inline-media";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";

export type SocialPostFormValues = Omit<SocialPost, "id" | "order">;

type SocialPostFormProps = {
  initial?: Partial<SocialPost>;
  onSubmit: (values: SocialPostFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

const MAX_BYTES = 20 * 1024 * 1024;
const NOTES_CATEGORIES: NotesCategory[] = ["Livre", "Réflexions", "Documents", "Images", "Vidéos"];

type UploadTarget = "general" | "cover" | "bookPdf" | "inline" | null;

/** Existing plain-text blocks become editable HTML only when the user edits them. */
function legacyBlockToEditableHtml(text: string) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return "<p>" + safe.replace(/\r\n?/g, "\n").replace(/\n/g, "<br>") + "</p>";
}

const MAX_TEXT_BLOCK_LENGTH = 40000;
const MAX_CAROUSEL_ITEMS = 24;

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
  // Legacy featured embeds stay where they are until intentionally moved.
  const [legacyFeatured, setLegacyFeatured] = useState<FeaturedEmbed | null>(
    normalizeFeaturedEmbed(initial?.featuredEmbed ?? (initial?.youtubeUrl ? { type: "youtube", url: initial.youtubeUrl } : null))
  );
  const [inlineMedia, setInlineMedia] = useState<InlinePostMedia[]>(normalizeInlinePostMedia(initial?.inlineMedia));
  const [insertType, setInsertType] = useState<FeaturedEmbed["type"] | "text" | "carousel">("youtube");
  const [carouselTitle, setCarouselTitle] = useState("");
  const [carouselItems, setCarouselItems] = useState<MediaItem[]>([]);
  const [editingCarouselId, setEditingCarouselId] = useState<string | null>(null);
  const [textBlockTitle, setTextBlockTitle] = useState("");
  const [textBlockBody, setTextBlockBody] = useState("");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [insertInput, setInsertInput] = useState("");
  const [mediaInsertion, setMediaInsertion] = useState<{ nonce: string; token: string }>();
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
  const parsedMedia = insertType !== "text" && insertType !== "carousel" && insertInput.trim() ? featuredEmbedFromInput(insertType, insertInput) : null;

  const insertInlineMedia = useCallback((media: FeaturedEmbed) => {
    const valid = normalizeFeaturedEmbed(media);
    if (!valid) { setError("Média non reconnu."); return; }
    const id = "media_" + crypto.randomUUID().replace(/-/g, "");
    setInlineMedia(prev => [...prev, { id, ...valid }]);
    setMediaInsertion({ nonce: id, token: mediaMarker(id) });
    setInsertInput("");
    setError(null);
  }, []);

  const insertCarousel = () => {
    const valid = normalizeInlineCarouselItems(carouselItems);
    if (!valid.length || valid.length !== carouselItems.length) {
      setError("Ajoute au moins une photo ou une vidéo valide pour créer le carrousel.");
      return;
    }
    const id = "media_" + crypto.randomUUID().replace(/-/g, "");
    setInlineMedia(prev => [...prev, {
      id,
      type: "carousel",
      title: carouselTitle.trim().slice(0, 160),
      items: valid,
    }]);
    setMediaInsertion({ nonce: id, token: mediaMarker(id) });
    setCarouselItems([]);
    setCarouselTitle("");
    setError(null);
  };

  const updateCarousel = (id: string, field: "title" | "items", value: string | MediaItem[]) => {
    setInlineMedia(prev => prev.map(item => {
      if (item.id !== id || item.type !== "carousel") return item;
      return field === "items"
        ? { ...item, items: value as MediaItem[] }
        : { ...item, title: String(value).slice(0, 160) };
    }));
  };

  const invalidCarousel = (item: InlinePostMedia) =>
    item.type === "carousel" &&
    (!item.items.length || item.items.length > MAX_CAROUSEL_ITEMS ||
      normalizeInlineCarouselItems(item.items).length !== item.items.length);

  const insertScrollText = () => {
    if (!stripHtml(textBlockBody).trim()) {
      setError("Écris le contenu du bloc de texte avant de l’insérer.");
      return;
    }
    if (textBlockBody.length > MAX_TEXT_BLOCK_LENGTH) {
      setError("Le bloc de texte dépasse 40 000 caractères, mise en forme comprise.");
      return;
    }
    const id = "media_" + crypto.randomUUID().replace(/-/g, "");
    setInlineMedia(prev => [...prev, {
      id,
      type: "text",
      title: textBlockTitle.trim().slice(0, 160),
      body: textBlockBody,
      format: "rich",
    }]);
    setMediaInsertion({ nonce: id, token: mediaMarker(id) });
    setTextBlockTitle("");
    setTextBlockBody("");
    setError(null);
  };

  const updateTextBlock = (id: string, field: "title" | "body", value: string) => {
    setInlineMedia(prev => prev.map(item =>
      item.id === id && item.type === "text"
        ? (field === "body"
          ? { ...item, body: value, format: "rich" as const }
          : { ...item, title: value })
        : item
    ));
  };

  const removeInlineMedia = (id: string) => {
    setInlineMedia(prev => prev.filter(media => media.id !== id));
    setDescription(prev => setL(prev, "fr", removeInlineMediaMarker(getL(prev, "fr"), id)));
  };

  const insertFromLink = () => {
    if (!parsedMedia) { setError("Colle un lien YouTube, X ou une URL d'image HTTPS valide."); return; }
    insertInlineMedia(parsedMedia);
  };

  const processFile = useCallback(async (file: File, target: Exclude<UploadTarget, null>) => {
    setError(null);
    const kind = detectFileKind(file);
    if (!kind) return setError("Ajoute une image ou un PDF.");
    if ((target === "cover" || target === "inline") && kind !== "image") return setError("La couverture doit être une image.");
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
      if (target === "inline") {
        insertInlineMedia({ type: "image", url: result.url });
      } else if (target === "cover") {
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
  }, [insertInlineMedia]);

  const buildValues = (nextVisible: boolean): SocialPostFormValues => ({
    title,
    subtitle: getL(subtitle, "fr").trim() ? subtitle : undefined,
    description,
    date: initial?.date || new Date().toISOString().slice(0, 10),
    youtubeUrl: legacyFeatured?.type === "youtube" ? legacyFeatured.url : null,
    featuredEmbed: legacyFeatured,
    inlineMedia,
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
    if (inlineMedia.some(invalidCarousel)) return setError("Un carrousel contient des médias invalides ou trop nombreux (maximum 24).");
    if (inlineMedia.some(media => media.type === "text" && !stripHtml(media.body).trim())) return setError("Un bloc de texte est vide. Complète-le avant de publier.");
    if (inlineMedia.some(media => media.type === "text" && media.body.length > MAX_TEXT_BLOCK_LENGTH)) return setError("Un bloc de texte dépasse 40 000 caractères.");
    onSubmit(buildValues(true));
  };

  const handleSaveDraft = () => {
    setError(null);
    if (inlineMedia.some(invalidCarousel)) return setError("Un carrousel contient des médias invalides ou trop nombreux (maximum 24).");
    if (inlineMedia.some(media => media.type === "text" && !stripHtml(media.body).trim())) return setError("Un bloc de texte est vide. Complète-le avant d’enregistrer.");
    if (inlineMedia.some(media => media.type === "text" && media.body.length > MAX_TEXT_BLOCK_LENGTH)) return setError("Un bloc de texte dépasse 40 000 caractères.");
    const hasSomething = Boolean(
      getL(title, "fr").trim() ||
        getL(subtitle, "fr").trim() ||
        getL(description, "fr").trim() ||
        inlineMedia.length > 0 ||
        Boolean(legacyFeatured) ||
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
        insertBlockToken={mediaInsertion}
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

      <div className="grid min-w-0 gap-3 rounded-2xl border border-cyan-200/15 bg-white/[0.025] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100/75">Insérer des médias dans le texte</p>
        <p className="text-xs leading-5 text-zinc-300">
          Clique dans le paragraphe souhaité, puis ajoute un média : il apparaîtra <strong>après ce paragraphe</strong>.
          Tu peux en insérer plusieurs. La photo de couverture reste toujours en haut.
        </p>
        <Label htmlFor="inline-media-type">Type de média</Label>
        <select id="inline-media-type" value={insertType}
          onChange={(e) => { setInsertType(e.target.value as FeaturedEmbed["type"] | "text" | "carousel"); setInsertInput(""); }}
          className="h-10 rounded-xl border border-white/15 bg-black/40 px-3 text-sm text-zinc-100">
          <option value="youtube">Vidéo YouTube</option>
          <option value="x">Post X</option>
          <option value="image">Photo (URL ou fichier)</option>
          <option value="text">Bloc de texte défilant</option>
          <option value="carousel">Carrousel photos / vidéos</option>
        </select>
        {insertType === "carousel" ? (
          <div className="grid min-w-0 gap-3 rounded-xl border border-cyan-100/10 bg-black/20 p-3">
            <p className="text-xs leading-5 text-zinc-300">
              Le même carrousel que dans Work : ajoute plusieurs photos, vidéos ou liens YouTube,
              puis organise les cartes par glisser-déposer. Il apparaîtra après le paragraphe sélectionné.
            </p>
            <Label htmlFor="notes-carousel-title">Titre du carrousel (facultatif)</Label>
            <Input id="notes-carousel-title" value={carouselTitle} maxLength={160}
              placeholder="Photos et vidéos de l'expérience…"
              onChange={e => setCarouselTitle(e.target.value)} />
            <MediaCarouselEditor
              items={carouselItems}
              onChange={setCarouselItems}
              folder={MEDIA_FOLDERS.social}
              maxItems={MAX_CAROUSEL_ITEMS}
            />
            <Button type="button" variant="secondary"
              disabled={!carouselItems.length || carouselItems.length > MAX_CAROUSEL_ITEMS || uploadTarget !== null}
              className="w-fit gap-2" onClick={insertCarousel}>
              <Plus className="h-4 w-4" /> Insérer ce carrousel dans le texte
            </Button>
          </div>
        ) : insertType === "text" ? (
          <div className="grid gap-3 rounded-xl border border-cyan-100/10 bg-black/20 p-3">
            <p className="text-xs leading-5 text-zinc-300">Un encart indépendant du récit, avec sa propre barre de défilement pour lire un extrait ou des paroles.</p>
            <Label htmlFor="scroll-text-title">Titre du bloc (facultatif)</Label>
            <Input id="scroll-text-title" value={textBlockTitle} maxLength={160}
              onChange={(e) => setTextBlockTitle(e.target.value)}
              placeholder="Paroles de la chanson, Extrait, Citation…" />
            <Label htmlFor="scroll-text-body">Texte du bloc</Label>
            <RichLocalizedField id="scroll-text-body" label="Texte enrichi" rows={9}
              value={textBlockBody}
              onChange={next => setTextBlockBody(getL(next, "fr"))}
              placeholder="Colle ici ton texte avec sa mise en forme, ou sélectionne du texte pour utiliser le gras, l’italique…" />
            <p className="text-xs text-zinc-400">Le collage conserve le gras et l’italique. ⌘B / Ctrl+B fonctionne dans cet éditeur.</p>
            {textBlockBody.length > MAX_TEXT_BLOCK_LENGTH && <p className="text-xs text-red-400">Texte trop long (40 000 caractères, mise en forme comprise).</p>}
            <Button type="button" variant="secondary" disabled={!stripHtml(textBlockBody).trim() || textBlockBody.length > MAX_TEXT_BLOCK_LENGTH || uploadTarget !== null}
              className="w-fit gap-2" onClick={insertScrollText}>
              <Plus className="h-4 w-4" /> Insérer ce bloc dans le texte
            </Button>
          </div>
        ) : (
          <>
            <Label htmlFor="inline-media-url">Lien du média (ou iframe YouTube)</Label>
            <Input id="inline-media-url" value={insertInput} onChange={e => setInsertInput(e.target.value)}
              placeholder={insertType === "youtube" ? "https://youtu.be/…" : insertType === "x" ? "https://x.com/.../status/…" : "https://.../photo.jpg"} />
            <Button type="button" variant="secondary" disabled={!parsedMedia || uploadTarget !== null}
              className="w-fit gap-2" onClick={insertFromLink}>
              <Plus className="h-4 w-4" /> Insérer ce média dans le texte
            </Button>
            {insertInput && !parsedMedia && <p className="text-xs text-amber-300">Lien non reconnu pour ce média.</p>}
            {insertType === "image" && (
              <FilePicker
                label="Ou téléverser une photo dans le texte"
                accept="image/*" value={null} fileName={null}
                uploading={uploadTarget === "inline"} progress={progress}
                onPick={file => void processFile(file, "inline")} onClear={() => {}}
                icon={ImageIcon}
              />
            )}
          </>
        )}
        {inlineMedia.length > 0 && (
          <div className="space-y-3 border-t border-white/10 pt-3">
            <p className="text-xs font-medium text-cyan-100">Médias insérés ({inlineMedia.length})</p>
            {inlineMedia.some(media => !getL(description, "fr").includes(mediaMarker(media.id))) && (
              <p className="text-xs text-amber-200">Certains médias n’ont pas encore d’emplacement dans le texte. Ils restent visibles à la fin du post ; clique dans le paragraphe souhaité puis sur « Placer dans le texte ».</p>
            )}
            {inlineMedia.map((media, index) => (
              <div key={media.id} className="grid min-w-0 gap-2 rounded-lg bg-black/25 px-3 py-2">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 break-words text-xs text-zinc-300">
                    {index + 1}. {media.type === "youtube" ? "YouTube" : media.type === "x" ? "X" : media.type === "text" ? "Bloc de texte" : media.type === "carousel" ? "Carrousel" : "Photo"}
                    {" — "}{media.type === "text" ? (media.title || "Extrait à lire") : media.type === "carousel" ? `${media.title || "Photos et vidéos"} (${media.items.length})` : media.url}
                  </span>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {media.type === "text" && (
                      <Button type="button" variant="secondary" size="sm"
                        onClick={() => setEditingTextId(current => current === media.id ? null : media.id)}>
                        {editingTextId === media.id ? "Terminer" : "Modifier le bloc"}
                      </Button>
                    )}
                    {media.type === "carousel" && (
                      <Button type="button" variant="secondary" size="sm"
                        onClick={() => setEditingCarouselId(current => current === media.id ? null : media.id)}>
                        {editingCarouselId === media.id ? "Terminer" : "Modifier le carrousel"}
                      </Button>
                    )}
                    {!getL(description, "fr").includes(mediaMarker(media.id)) && (
                      <Button type="button" variant="secondary" size="sm"
                        title="Placer ce média après le paragraphe sélectionné"
                        onClick={() => {
                          setMediaInsertion({ nonce: crypto.randomUUID(), token: mediaMarker(media.id) });
                          setError(null);
                        }}>
                        Placer dans le texte
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeInlineMedia(media.id)} title="Retirer le média">
                      <X className="h-4 w-4" /> Retirer
                    </Button>
                  </div>
                </div>
                {media.type === "carousel" && editingCarouselId === media.id && (
                  <div className="grid min-w-0 gap-3 border-t border-white/10 pt-3">
                    <Label htmlFor={`carousel-title-${media.id}`}>Titre du carrousel</Label>
                    <Input id={`carousel-title-${media.id}`} value={media.title} maxLength={160}
                      onChange={e => updateCarousel(media.id, "title", e.target.value)} />
                    <MediaCarouselEditor
                      items={media.items}
                      onChange={items => updateCarousel(media.id, "items", items)}
                      folder={MEDIA_FOLDERS.social}
                      maxItems={MAX_CAROUSEL_ITEMS}
                    />
                    <p className="text-xs text-zinc-400">Les changements seront enregistrés avec la publication.</p>
                  </div>
                )}
                {media.type === "text" && editingTextId === media.id && (
                  <div className="grid gap-2 border-t border-white/10 pt-3">
                    <Label htmlFor={`text-title-${media.id}`}>Titre</Label>
                    <Input id={`text-title-${media.id}`} value={media.title} maxLength={160}
                      onChange={e => updateTextBlock(media.id, "title", e.target.value)} />
                    <Label htmlFor={`text-body-${media.id}`}>Contenu du bloc</Label>
                    <RichLocalizedField
                      id={`text-body-${media.id}`}
                      label="Texte enrichi"
                      rows={8}
                      value={media.format === "rich" ? media.body : legacyBlockToEditableHtml(media.body)}
                      onChange={next => updateTextBlock(media.id, "body", getL(next, "fr"))}
                      placeholder="Modifie le texte, utilise la barre de mise en forme ou ⌘B / Ctrl+B."
                    />
                    {media.body.length > MAX_TEXT_BLOCK_LENGTH && <p className="text-xs text-red-400">Bloc trop long : limite 40 000 caractères.</p>}
                    <p className="text-xs text-zinc-400">Ces modifications seront enregistrées avec le post.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {legacyFeatured && (
          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="text-xs text-zinc-400">Ancien média de cette publication, actuellement placé avant le texte :</p>
            <FeaturedMedia media={legacyFeatured} title="Média existant" autoplay={false} />
            <Button type="button" variant="secondary" onClick={() => {
              insertInlineMedia(legacyFeatured);
              setLegacyFeatured(null);
            }}>Déplacer ce média après le paragraphe sélectionné</Button>
          </div>
        )}
      </div>

      <FilePicker
        label={isBook ? "Couverture du chapitre (facultatif)" : "Photo de couverture du post (facultatif)"}
        accept="image/*"
        value={bookCoverUrl}
        fileName={bookCoverName}
        uploading={uploadTarget === "cover"}
        progress={progress}
        onPick={(file) => void processFile(file, "cover")}
        onClear={() => { setBookCoverUrl(null); setBookCoverName(null); }}
        icon={ImageIcon}
      />
      {isBook ? (
        <FilePicker
          label="PDF du chapitre (facultatif)"
          accept="application/pdf,.pdf"
          value={bookPdfUrl}
          fileName={bookPdfName}
          uploading={uploadTarget === "bookPdf"}
          progress={progress}
          onPick={(file) => void processFile(file, "bookPdf")}
          onClear={() => { setBookPdfUrl(null); setBookPdfName(null); }}
          icon={FileText}
        />
      ) : (
        <FilePicker
          label="Image ou PDF supplémentaire (facultatif)"
          accept="application/pdf,.pdf,image/*"
          value={fileUrl}
          fileName={fileName}
          uploading={uploadTarget === "general"}
          progress={progress}
          onPick={(file) => void processFile(file, "general")}
          onClear={() => { setFileUrl(null); setFileKind(null); setFileName(null); }}
        />
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

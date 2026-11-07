"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Cloud, FileText, FileUp, ImageIcon, Link2, Loader2, Plus, Save, X } from "lucide-react";
import type { SocialPost, SocialPostCoverSource, SocialPostFileKind, InlinePostMedia, FeaturedEmbed, MediaItem } from "@/lib/types";
import { AIR_CATEGORIES, NOTES_CATEGORIES, coercePostCategory, type PostCategory } from "@/lib/post-taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { MediaCarouselEditor } from "@/components/shared/MediaCarouselEditor";
import { stripHtml } from "@/lib/sanitize-html";
import { getL, liftToLocalized, setL, type LocalizedString } from "@/lib/i18n-content";
import { MEDIA_FOLDERS, isR2Url, uploadToBlob } from "@/lib/blob-upload";
import { cn } from "@/lib/utils";
import { featuredEmbedFromInput, normalizeFeaturedEmbed } from "@/lib/featured-embed";
import { mediaMarker, removeInlineMediaMarker, normalizeInlinePostMedia, normalizeInlineCarouselItems } from "@/lib/post-inline-media";
import { FeaturedMedia } from "@/components/medias/FeaturedMedia";
import { WorkInProgress } from "@/components/media/WorkInProgress";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { AIR_NOTICE_INTRO, AIR_NOTICE_REPLY, BOOK_NOTICE, airNoticeHtml } from "@/lib/air-notices";

export type SocialPostFormValues = Omit<SocialPost, "id" | "order">;

type SocialPostFormProps = {
  initial?: Partial<SocialPost>;
  universe?: "notes" | "air";
  onSubmit: (values: SocialPostFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

const MAX_BYTES = 20 * 1024 * 1024;

type UploadTarget = "general" | "cover" | "bookPdf" | "inline" | "replace" | null;

/** Existing plain-text blocks become editable HTML only when the user edits them. */
function legacyBlockToEditableHtml(text: string) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return "<p>" + safe.replace(/\r\n?/g, "\n").replace(/\n/g, "<br>") + "</p>";
}

const MAX_TEXT_BLOCK_LENGTH = 40000;
const MAX_CAROUSEL_ITEMS = 24;
const NEW_SERIES = "__new_series__";

function detectFileKind(file: File): SocialPostFileKind | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(name)) return "image";
  return null;
}

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".")) return null;
    if (url.toString().length > 2048) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function initialCoverChoice(initial?: Partial<SocialPost>): SocialPostCoverSource {
  if (initial?.coverSource === "wip" || initial?.coverSource === "web" || initial?.coverSource === "cloudflare") {
    return initial.coverSource;
  }
  if (initial?.bookCoverUrl && isR2Url(initial.bookCoverUrl)) return "cloudflare";
  if (initial?.bookCoverUrl) return "web";
  return "cloudflare";
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
  universe = "notes",
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
}: SocialPostFormProps) {
  const [title, setTitle] = useState<LocalizedString>(liftToLocalized(initial?.title));
  const [subtitle, setSubtitle] = useState<LocalizedString>(liftToLocalized(initial?.subtitle));
  const [articleSubtitle, setArticleSubtitle] = useState<LocalizedString>(liftToLocalized(initial?.articleSubtitle));
  const [episode, setEpisode] = useState(initial?.episode?.trim() ?? "");
  const [noticesHidden, setNoticesHidden] = useState(initial?.noticesHidden === true);
  const [pinned, setPinned] = useState(initial?.pinned === true);
  const [noticeIntro, setNoticeIntro] = useState<LocalizedString>(liftToLocalized(airNoticeHtml(initial?.noticeIntro, AIR_NOTICE_INTRO)));
  const [noticeReply, setNoticeReply] = useState<LocalizedString>(liftToLocalized(airNoticeHtml(initial?.noticeReply, AIR_NOTICE_REPLY)));
  const [bookNotice, setBookNotice] = useState<LocalizedString>(liftToLocalized(airNoticeHtml(initial?.noticeIntro, BOOK_NOTICE)));
  const noticesTouched = useRef(false);
  const bookNoticeTouched = useRef(false);
  const { data: portfolioData, renameAirSeries } = usePortfolio();
  useEffect(() => {
    if (universe !== "air" || initial || noticesTouched.current) return;
    const posts = (portfolioData.socialPosts ?? []).filter((post) => post.universe === "air");
    const intro = posts.find((post) => getL(post.noticeIntro, "fr").trim());
    const reply = posts.find((post) => getL(post.noticeReply, "fr").trim());
    if (intro) setNoticeIntro(liftToLocalized(airNoticeHtml(intro.noticeIntro, AIR_NOTICE_INTRO)));
    if (reply) setNoticeReply(liftToLocalized(airNoticeHtml(reply.noticeReply, AIR_NOTICE_REPLY)));
  }, [universe, initial, portfolioData.socialPosts]);
  const existingSeries = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of portfolioData.socialPosts ?? []) {
      if ((post.universe ?? "notes") !== "air") continue;
      const name = getL(post.subtitle, "fr").trim().replace(/\s+/g, " ").slice(0, 160);
      const key = name.toLocaleLowerCase("fr");
      if (name && !seen.has(key)) seen.set(key, name);
    }
    return [...seen.values()];
  }, [portfolioData.socialPosts]);
  const initialSeries = getL(liftToLocalized(initial?.subtitle), "fr").trim();
  const knownSeries = existingSeries.find((name) => name.toLocaleLowerCase("fr") === initialSeries.toLocaleLowerCase("fr"));
  const [seriesChoice, setSeriesChoice] = useState(knownSeries ?? (initialSeries ? NEW_SERIES : ""));
  const [newSeriesName, setNewSeriesName] = useState(knownSeries ? "" : initialSeries);
  const [renameDraft, setRenameDraft] = useState(knownSeries ?? initialSeries);
  const seriesSynced = useRef(false);
  useEffect(() => {
    if (seriesSynced.current || !initialSeries) return;
    const match = existingSeries.find((name) => name.toLocaleLowerCase("fr") === initialSeries.toLocaleLowerCase("fr"));
    if (!match) return;
    seriesSynced.current = true;
    setSeriesChoice(match);
    setNewSeriesName("");
  }, [existingSeries, initialSeries]);
  const [description, setDescription] = useState<LocalizedString>(liftToLocalized(initial?.description));
  const categories = universe === "air" ? AIR_CATEGORIES : NOTES_CATEGORIES;
  const [category, setCategory] = useState<PostCategory>(
    coercePostCategory({ ...initial, universe: initial?.universe ?? universe })
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
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);
  const [replaceSource, setReplaceSource] = useState<"web" | "cloudflare">("web");
  const [replaceInput, setReplaceInput] = useState("");
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
  const [contentHidden, setContentHidden] = useState(initial?.contentHidden === true);
  const [coverChoice, setCoverChoice] = useState<SocialPostCoverSource>(initialCoverChoice(initial));
  const [webCoverInput, setWebCoverInput] = useState(
    initial?.coverSource === "web" || (!initial?.coverSource && initial?.bookCoverUrl && !isR2Url(initial.bookCoverUrl))
      ? (initial.bookCoverUrl ?? "")
      : ""
  );
  const [cloudCoverInput, setCloudCoverInput] = useState(
    initial?.bookCoverUrl && isR2Url(initial.bookCoverUrl) ? initial.bookCoverUrl : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const applySeries = (choice: string, draftName = newSeriesName) => {
    setSeriesChoice(choice);
    if (choice && choice !== NEW_SERIES) setRenameDraft(choice);
    if (choice === NEW_SERIES) {
      const name = draftName.trim().replace(/\s+/g, " ").slice(0, 160);
      setSubtitle(name ? liftToLocalized(name) : liftToLocalized(""));
      return;
    }
    setSubtitle(choice ? liftToLocalized(choice) : liftToLocalized(""));
  };

  const renameCurrentSeries = () => {
    if (!seriesChoice || seriesChoice === NEW_SERIES) return;
    const next = renameDraft.trim().replace(/\s+/g, " ").slice(0, 160);
    if (!next) {
      setError("Écris le nouveau nom de la série.");
      return;
    }
    if (next === seriesChoice) return;
    renameAirSeries(seriesChoice, next);
    setSeriesChoice(next);
    setSubtitle(liftToLocalized(next));
    setRenameDraft(next);
    setError(null);
  };

  const isBook = category === "Livre";
  useEffect(() => {
    if (universe === "air" || !isBook || bookNoticeTouched.current) return;
    if (getL(initial?.noticeIntro, "fr").trim()) return;
    const source = (portfolioData.socialPosts ?? []).find((post) =>
      (post.universe ?? "notes") !== "air"
      && coercePostCategory(post) === "Livre"
      && post.id !== initial?.id
      && getL(post.noticeIntro, "fr").trim()
    );
    if (source) setBookNotice(liftToLocalized(airNoticeHtml(source.noticeIntro, BOOK_NOTICE)));
  }, [universe, isBook, initial, portfolioData.socialPosts]);
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
    if (replacingPhotoId === id) setReplacingPhotoId(null);
  };

  const applyPhotoReplacement = (id: string, raw: string, source: "web" | "cloudflare") => {
    const url = safeHttpsUrl(raw.trim());
    if (!url) {
      setError("Le lien de la photo doit commencer par https://.");
      return false;
    }
    if (source === "cloudflare" && !isR2Url(url)) {
      setError("Pour Cloudflare, téléverse une image ou colle un lien media.patrickroziel.com.");
      return false;
    }
    if (source === "web" && isR2Url(url)) {
      setError("Cette image est déjà sur Cloudflare. Choisis Cloudflare.");
      return false;
    }
    const valid = normalizeFeaturedEmbed({ type: "image", url });
    if (!valid) {
      setError("Ce lien n’est pas une image utilisable.");
      return false;
    }
    setInlineMedia(prev => prev.map(item => item.id === id && item.type === "image" ? { ...item, url: valid.url } : item));
    setReplaceInput(valid.url);
    setError(null);
    return true;
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
      } else if (target === "replace") {
        if (replacingPhotoId) {
          setInlineMedia(prev => prev.map(item => item.id === replacingPhotoId && item.type === "image" ? { ...item, url: result.url } : item));
          setReplaceInput(result.url);
          setReplaceSource("cloudflare");
          setError(null);
        }
      } else if (target === "cover") {
        setBookCoverUrl(result.url);
        setBookCoverName(file.name);
        setCloudCoverInput(result.url);
        setCoverChoice("cloudflare");
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
  }, [insertInlineMedia, replacingPhotoId]);

  const resolveCover = (): {
    coverSource: SocialPostCoverSource | null;
    bookCoverUrl: string | null;
    bookCoverName: string | null;
    error?: string;
  } => {
    if (coverChoice === "wip") {
      return { coverSource: "wip", bookCoverUrl: null, bookCoverName: null };
    }
    if (coverChoice === "web") {
      const raw = webCoverInput.trim();
      if (!raw) return { coverSource: null, bookCoverUrl: null, bookCoverName: null };
      const url = safeHttpsUrl(raw);
      if (!url) return { coverSource: null, bookCoverUrl: null, bookCoverName: null, error: "Le lien de couverture doit commencer par https://." };
      if (isR2Url(url)) {
        return { coverSource: null, bookCoverUrl: null, bookCoverName: null, error: "Cette image est déjà sur Cloudflare. Choisis l’option Cloudflare." };
      }
      return { coverSource: "web", bookCoverUrl: url, bookCoverName: null };
    }
    const candidate = cloudCoverInput.trim() || (bookCoverUrl && isR2Url(bookCoverUrl) ? bookCoverUrl : "");
    if (!candidate) return { coverSource: null, bookCoverUrl: null, bookCoverName: null };
    if (!safeHttpsUrl(candidate) || !isR2Url(candidate)) {
      return { coverSource: null, bookCoverUrl: null, bookCoverName: null, error: "Pour Cloudflare, téléverse une image ou colle un lien media.patrickroziel.com." };
    }
    return { coverSource: "cloudflare", bookCoverUrl: candidate, bookCoverName };
  };

  const buildValues = (nextVisible: boolean): SocialPostFormValues | null => {
    const cover = resolveCover();
    if (cover.error) {
      setError(cover.error);
      return null;
    }
    return {
    universe: initial?.universe ?? universe,
    title,
    subtitle: getL(subtitle, "fr").trim() ? subtitle : undefined,
    articleSubtitle: universe === "air" && getL(articleSubtitle, "fr").trim() ? articleSubtitle : undefined,
    episode: universe === "air" && episode.trim() ? episode.trim().slice(0, 16) : null,
    description,
    date: initial?.date || new Date().toISOString().slice(0, 10),
    youtubeUrl: legacyFeatured?.type === "youtube" ? legacyFeatured.url : null,
    featuredEmbed: legacyFeatured,
    inlineMedia,
    fileUrl,
    fileKind: fileUrl ? fileKind : null,
    fileName: fileUrl ? fileName : null,
    bookCoverUrl: cover.bookCoverUrl,
    bookCoverName: cover.bookCoverName,
    bookPdfUrl,
    bookPdfName,
    coverSource: cover.coverSource,
    contentHidden,
    ...(universe === "air" ? {} : {
      pinned,
      pinnedAt: pinned ? (initial?.pinnedAt || new Date().toISOString()) : null,
    }),
    noticesHidden: universe === "air" || isBook ? noticesHidden : undefined,
    noticeIntro: universe === "air" ? noticeIntro : isBook ? bookNotice : undefined,
    noticeReply: universe === "air" ? noticeReply : undefined,
    category,
    tags: Array.from(
      new Set(tagsText.split(",").map((tag) => tag.trim()).filter(Boolean))
    ),
    visible: nextVisible,
  };
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (e.target !== e.currentTarget) return;
    setError(null);
    if (!getL(title, "fr").trim()) return setError("Le titre est obligatoire pour publier.");
    if (!contentHidden && isBook && !getL(description, "fr").trim()) return setError("Ajoute le texte du chapitre avant de publier.");
    if (!contentHidden && inlineMedia.some(invalidCarousel)) return setError("Un carrousel contient des médias invalides ou trop nombreux (maximum 24).");
    if (!contentHidden && inlineMedia.some(media => media.type === "text" && !stripHtml(media.body).trim())) return setError("Un bloc de texte est vide. Complète-le avant de publier.");
    if (!contentHidden && inlineMedia.some(media => media.type === "text" && media.body.length > MAX_TEXT_BLOCK_LENGTH)) return setError("Un bloc de texte dépasse 40 000 caractères.");
    const values = buildValues(true);
    if (values) onSubmit(values);
  };

  const handleSaveDraft = () => {
    setError(null);
    if (inlineMedia.some(invalidCarousel)) return setError("Un carrousel contient des médias invalides ou trop nombreux (maximum 24).");
    if (inlineMedia.some(media => media.type === "text" && !stripHtml(media.body).trim())) return setError("Un bloc de texte est vide. Complète-le avant d’enregistrer.");
    if (inlineMedia.some(media => media.type === "text" && media.body.length > MAX_TEXT_BLOCK_LENGTH)) return setError("Un bloc de texte dépasse 40 000 caractères.");
    const hasSomething = Boolean(
      getL(title, "fr").trim() ||
        getL(subtitle, "fr").trim() ||
        getL(articleSubtitle, "fr").trim() ||
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
    const values = buildValues(false);
    if (values) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-5">
      <div className="grid gap-2">
        {universe === "air" ? (
          <>
            <Label htmlFor="air-series">Série</Label>
            <select
              id="air-series"
              value={seriesChoice}
              onChange={(e) => applySeries(e.target.value)}
              className="h-10 w-full min-w-0 rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-300/40"
            >
              <option value="">Choisir une série</option>
              {existingSeries.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value={NEW_SERIES}>Créer une nouvelle série…</option>
            </select>
            {seriesChoice === NEW_SERIES && (
              <Input
                id="air-series-new"
                value={newSeriesName}
                maxLength={160}
                onChange={(e) => {
                  setNewSeriesName(e.target.value);
                  applySeries(NEW_SERIES, e.target.value);
                }}
                placeholder="Nom de la nouvelle série"
              />
            )}
            {seriesChoice && seriesChoice !== NEW_SERIES && (
              <div className="grid gap-2 pt-1">
                <Label htmlFor="air-series-rename">Renommer cette série</Label>
                <div className="flex min-w-0 items-center gap-2">
                  <Input
                    id="air-series-rename"
                    value={renameDraft}
                    maxLength={160}
                    onChange={(e) => setRenameDraft(e.target.value)}
                  />
                  <Button type="button" variant="secondary" onClick={renameCurrentSeries} className="shrink-0">
                    Renommer
                  </Button>
                </div>
                <p className="text-xs leading-5 text-zinc-500">Le nouveau nom remplace l’ancien sur tous les épisodes de cette série.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <Label htmlFor="notes-category">Catégorie</Label>
            <select
              id="notes-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="h-10 w-full min-w-0 rounded-xl border border-white/12 bg-black/35 px-3 text-sm text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-300/40"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </>
        )}
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

      {universe !== "air" && (
      <LocalizedField
        label={isBook ? "Titre du chapitre *" : "Titre *"}
        value={title}
        onChange={setTitle}
        placeholder={isBook ? "Ex. Chapitre 1 — Le départ" : "Titre du post"}
      />
      )}
      {universe !== "air" && (
        <button
          type="button"
          onClick={() => {
            if (!pinned) {
              const count = (portfolioData.socialPosts ?? []).filter((post) => post.universe !== "air" && post.pinned && post.id !== initial?.id).length;
              if (count >= 6) {
                setError("Six posts sont déjà épinglés.");
                return;
              }
            }
            setError(null);
            setPinned((value) => !value);
          }}
          className={cn(
            "w-fit rounded-xl border px-3 py-2.5 text-left text-sm transition",
            pinned
              ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50"
              : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
          )}
        >
          <span className="block font-medium">{pinned ? "Épinglé sur l’accueil" : "Épingler sur l’accueil"}</span>
          <span className="mt-0.5 block text-xs font-normal text-zinc-400">Jusqu’à 6 posts, avec leur visuel et leur titre.</span>
        </button>
      )}
      {universe === "air" && (
      <>
      <LocalizedField
        label="Titre *"
        value={title}
        onChange={setTitle}
        placeholder="Titre de l’article"
      />
      <LocalizedField
        label="Sous-titre (facultatif)"
        value={articleSubtitle}
        onChange={setArticleSubtitle}
        placeholder="Une phrase courte sous le titre"
      />
      </>
      )}

      {universe !== "air" && (
      <LocalizedField
        label="Sous-titre (facultatif)"
        value={subtitle}
        onChange={setSubtitle}
        placeholder={isBook ? "Une phrase courte pour introduire le chapitre" : "Une phrase courte sous le titre"}
      />
      )}
      {universe === "air" && (
        <div className="grid max-w-[12rem] gap-2">
          <Label htmlFor="air-episode">Numéro d’épisode</Label>
          <Input
            id="air-episode"
            inputMode="numeric"
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="7"
          />
        </div>
      )}

      {universe === "air" && (
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Label>Mentions de l’article</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setNoticesHidden(false)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                !noticesHidden
                  ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Afficher les deux mentions</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">Sous la couverture et en fin d’article.</span>
            </button>
            <button
              type="button"
              onClick={() => setNoticesHidden(true)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                noticesHidden
                  ? "border-amber-200/50 bg-amber-200/10 text-amber-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Masquer les deux mentions</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">L’une ne peut pas rester seule.</span>
            </button>
          </div>
          <RichLocalizedField
            id="air-notice-intro"
            label="Sous la couverture"
            value={noticeIntro}
            onChange={(value) => { noticesTouched.current = true; setNoticeIntro(value); }}
            rows={4}
          />
          <RichLocalizedField
            id="air-notice-reply"
            label="En fin d’article"
            value={noticeReply}
            onChange={(value) => { noticesTouched.current = true; setNoticeReply(value); }}
            rows={5}
          />
        </div>
      )}

      {isBook && (
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Label>Mention du livre</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setNoticesHidden(false)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                !noticesHidden
                  ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Afficher la mention</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">Au-dessus de ce chapitre.</span>
            </button>
            <button
              type="button"
              onClick={() => setNoticesHidden(true)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                noticesHidden
                  ? "border-amber-200/50 bg-amber-200/10 text-amber-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Masquer la mention</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">Uniquement pour ce chapitre.</span>
            </button>
          </div>
          <RichLocalizedField
            id="book-notice"
            label="Au-dessus du chapitre"
            value={bookNotice}
            onChange={(value) => { bookNoticeTouched.current = true; setBookNotice(value); }}
            rows={5}
          />
        </div>
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
                    {media.type === "image" && (
                      <Button type="button" variant="secondary" size="sm"
                        onClick={() => {
                          if (replacingPhotoId === media.id) {
                            setReplacingPhotoId(null);
                            return;
                          }
                          setReplacingPhotoId(media.id);
                          setReplaceSource(isR2Url(media.url) ? "cloudflare" : "web");
                          setReplaceInput(media.url);
                          setError(null);
                        }}>
                        {replacingPhotoId === media.id ? "Terminer" : "Remplacer"}
                      </Button>
                    )}
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
                {media.type === "image" && (
                  <img src={media.url} alt="" className="h-20 w-32 rounded-lg object-cover" referrerPolicy="no-referrer" />
                )}
                {media.type === "image" && replacingPhotoId === media.id && (
                  <div className="grid gap-3 border-t border-white/10 pt-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button type="button" onClick={() => setReplaceSource("web")}
                        className={cn("rounded-xl border px-3 py-2 text-left text-sm", replaceSource === "web" ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50" : "border-white/10 bg-black/20 text-zinc-300")}>
                        Lien
                      </button>
                      <button type="button" onClick={() => setReplaceSource("cloudflare")}
                        className={cn("rounded-xl border px-3 py-2 text-left text-sm", replaceSource === "cloudflare" ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50" : "border-white/10 bg-black/20 text-zinc-300")}>
                        Cloudflare
                      </button>
                    </div>
                    {replaceSource === "web" ? (
                      <>
                        <Label htmlFor={`replace-web-${media.id}`}>Lien de la nouvelle photo</Label>
                        <Input id={`replace-web-${media.id}`} value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} placeholder="https://…/photo.jpg" />
                        <Button type="button" variant="secondary" className="w-fit" onClick={() => applyPhotoReplacement(media.id, replaceInput, "web")}>
                          Remplacer par ce lien
                        </Button>
                      </>
                    ) : (
                      <>
                        <Label htmlFor={`replace-r2-${media.id}`}>Lien Cloudflare</Label>
                        <Input id={`replace-r2-${media.id}`} value={replaceInput} onChange={(e) => setReplaceInput(e.target.value)} placeholder="https://media.patrickroziel.com/…" />
                        <Button type="button" variant="secondary" className="w-fit" onClick={() => applyPhotoReplacement(media.id, replaceInput, "cloudflare")}>
                          Utiliser ce lien Cloudflare
                        </Button>
                        <FilePicker
                          label="Ou téléverser une autre photo sur Cloudflare"
                          accept="image/*" value={null} fileName={null}
                          uploading={uploadTarget === "replace"} progress={progress}
                          onPick={file => void processFile(file, "replace")} onClear={() => {}}
                          icon={ImageIcon}
                        />
                      </>
                    )}
                  </div>
                )}
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

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-2">
          <Label>Publication</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setContentHidden(false)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                !contentHidden
                  ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Article complet</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">Le titre et le texte sont visibles.</span>
            </button>
            <button
              type="button"
              onClick={() => setContentHidden(true)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                contentHidden
                  ? "border-amber-200/50 bg-amber-200/10 text-amber-50"
                  : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
              )}
            >
              <span className="block font-medium">Work in progress</span>
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">En cours d’édition : seul le titre est publié, le texte reste masqué.</span>
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Photo de couverture</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["wip", "Work in progress", ImageIcon],
              ["web", "Lien web", Link2],
              ["cloudflare", "Cloudflare", Cloud],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCoverChoice(value)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-medium transition",
                  coverChoice === value
                    ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50"
                    : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/25"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
          {coverChoice === "wip" && (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="relative aspect-[16/7]">
                <WorkInProgress className="blob-wip--fill" />
              </div>
              <p className="px-3 py-2 text-xs leading-5 text-zinc-400">
                La création « work in progress » actuelle sert de couverture. Aucune photo n’est publiée.
              </p>
            </div>
          )}
          {coverChoice === "web" && (
            <div className="grid gap-2">
              <Input
                id="cover-web-url"
                value={webCoverInput}
                onChange={(e) => setWebCoverInput(e.target.value)}
                placeholder="https://…/photo.jpg"
                inputMode="url"
              />
              <p className="text-xs leading-5 text-zinc-500">Une image déjà en ligne, ailleurs que sur ton Cloudflare.</p>
              {safeHttpsUrl(webCoverInput) && !isR2Url(webCoverInput) && (
                <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={safeHttpsUrl(webCoverInput) ?? ""} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          )}
          {coverChoice === "cloudflare" && (
            <div className="grid gap-2">
              <FilePicker
                label="Téléverser sur Cloudflare"
                accept="image/*"
                value={cloudCoverInput || (bookCoverUrl && isR2Url(bookCoverUrl) ? bookCoverUrl : null)}
                fileName={bookCoverName}
                uploading={uploadTarget === "cover"}
                progress={progress}
                onPick={(file) => void processFile(file, "cover")}
                onClear={() => { setBookCoverUrl(null); setBookCoverName(null); setCloudCoverInput(""); }}
                icon={ImageIcon}
              />
              <Label htmlFor="cover-r2-url">Ou un lien déjà hébergé sur Cloudflare</Label>
              <Input
                id="cover-r2-url"
                value={cloudCoverInput}
                onChange={(e) => {
                  setCloudCoverInput(e.target.value);
                  setBookCoverUrl(e.target.value.trim() || null);
                  if (!e.target.value.trim()) setBookCoverName(null);
                }}
                placeholder="https://media.patrickroziel.com/…"
                inputMode="url"
              />
              {isR2Url(cloudCoverInput) && (
                <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cloudCoverInput} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
      <div className="sticky bottom-0 z-30 -mx-1 grid gap-2 rounded-2xl border border-white/10 bg-[#0b1016]/95 px-2 py-2 backdrop-blur-xl sm:grid-cols-[auto_1fr_auto] sm:items-center">
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
          {contentHidden ? "Publier le titre" : submitLabel}
        </Button>
      </div>
      <p className="text-xs leading-5 text-zinc-500 sm:text-right">
        {contentHidden
          ? "Le titre et la couverture seront en ligne. Le texte, les médias et les fichiers restent masqués jusqu’à ce que tu publies l’article complet."
          : "Les brouillons restent dans tes données et sont inclus dans l’Export JSON, mais ils ne sont pas visibles publiquement."}
      </p>
    </form>
  );
}

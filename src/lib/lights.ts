import type { FeatureVideo, LightNote, LightRatio, MainShowreel, Project, SocialPost, Translatable } from "@/lib/types";
import { vimeoCanonical, vimeoEmbedUrl, vimeoThumb, vimeoVideo, youtubeEmbedUrl, youtubeThumb, youtubeVideoId } from "@/lib/utils";

export type LightKind = LightNote["kind"];

export type LightCard = {
  id: string;
  kind: LightKind;
  text: string;
  date: string;
  mediaUrl: string | null;
  thumb: string | null;
  embed: string | null;
  file: boolean;
  href: string | null;
  source: string | null;
  ownId: string | null;
  ratio: LightRatio;
  postedAt: string;
};

const KINDS = new Set<LightKind>(["words", "quote", "image", "video", "x", "instagram"]);
const RATIOS = new Set<LightRatio>(["original", "1:1", "4:5", "16:9"]);

function ratioOf(value: unknown): LightRatio {
  return RATIOS.has(value as LightRatio) ? value as LightRatio : "original";
}

export function normalizeLightNotes(raw: unknown): LightNote[] {
  if (!Array.isArray(raw)) return [];
  const notes: LightNote[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LightNote>;
    const kind = KINDS.has(row.kind as LightKind) ? row.kind as LightKind : null;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!kind || !id) continue;
    const text = typeof row.text === "string" ? row.text.replace(/\s+/g, " ").trim().slice(0, 500) : "";
    const url = typeof row.url === "string" && row.url.trim().startsWith("https://") ? row.url.trim().slice(0, 400) : null;
    if ((kind === "words" || kind === "quote") && !text) continue;
    if (kind !== "words" && kind !== "quote" && !url) continue;
    const date = typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : "";
    const postedAt = typeof row.postedAt === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.postedAt) ? row.postedAt : "";
    notes.push({ id, kind, text, url, date, visible: row.visible !== false, ratio: ratioOf(row.ratio), ...(postedAt ? { postedAt } : {}) });
  }
  return notes;
}

function textOf(value: Translatable | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.fr || "";
}

function youtube(url: string | null | undefined) {
  const value = url?.trim();
  return value && youtubeVideoId(value) ? value : null;
}

function fileVideo(url: string | null | undefined) {
  const value = url?.trim();
  if (!value || youtubeVideoId(value) || vimeoCanonical(value)) return null;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(value) || /\/video\/upload\//i.test(value)) return value;
  return null;
}

function imageUrl(url: string | null | undefined) {
  const value = url?.trim();
  if (!value || !value.startsWith("https://") || fileVideo(value) || youtube(value)) return null;
  return value;
}

function socialUrl(url: string | null | undefined, host: "x" | "instagram") {
  const value = url?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const name = parsed.hostname.replace(/^www\./, "");
    if (host === "instagram") return name === "instagram.com" ? value : null;
    if (name === "x.com" || name === "twitter.com") return value;
  } catch {
    return null;
  }
  return null;
}

function videoCard(partial: { id: string; text: string; date: string; href: string | null; source: string | null; watchUrl: string }): LightCard | null {
  const id = youtubeVideoId(partial.watchUrl);
  if (id) {
    return { ...partial, kind: "video", mediaUrl: partial.watchUrl, thumb: youtubeThumb(partial.watchUrl), embed: youtubeEmbedUrl(partial.watchUrl), file: false, ownId: null, ratio: "original", postedAt: "" };
  }
  const vimeo = vimeoEmbedUrl(partial.watchUrl);
  if (vimeo) {
    return { ...partial, kind: "video", mediaUrl: partial.watchUrl, thumb: vimeoThumb(partial.watchUrl), embed: vimeo, file: false, ownId: null, ratio: "original", postedAt: "" };
  }
  if (!fileVideo(partial.watchUrl)) return null;
  return { ...partial, kind: "video", mediaUrl: partial.watchUrl, thumb: null, embed: null, file: true, ownId: null, ratio: "original", postedAt: "" };
}

function fromPost(post: SocialPost, titleOf: (value: Translatable | undefined, fallback: string) => string): LightCard[] {
  const source = post.universe === "air" ? "Scope" : "Notes";
  const href = source === "Scope" ? `/air/${post.id}` : `/notes/${post.id}`;
  const text = titleOf(post.title, "Sans titre");
  const date = post.date || "";
  const out: LightCard[] = [];
  const seen = new Set<string>();

  const push = (card: LightCard | null) => {
    const key = card?.mediaUrl || card?.id;
    if (!card || !key || seen.has(key)) return;
    seen.add(key);
    out.push(card);
  };

  const addVideo = (url: string | null | undefined) => {
    const watchUrl = youtube(url) || vimeoCanonical(url || "") || fileVideo(url);
    if (!watchUrl) return;
    push(videoCard({
      id: `${post.id}-${youtubeVideoId(watchUrl) || vimeoVideo(watchUrl)?.id || watchUrl}`,
      text,
      date,
      href,
      source,
      watchUrl,
    }));
  };
  const addImage = (url: string | null | undefined) => {
    const image = imageUrl(url);
    if (!image) return;
    push({ id: `${post.id}-img-${image}`, kind: "image", text, date, mediaUrl: image, thumb: image, embed: null, file: false, href, source, ownId: null, ratio: "original", postedAt: "" });
  };
  const addSocial = (url: string | null | undefined) => {
    const x = socialUrl(url, "x");
    if (x) {
      push({ id: `${post.id}-x-${x}`, kind: "x", text, date, mediaUrl: x, thumb: null, embed: null, file: false, href, source, ownId: null, ratio: "original", postedAt: "" });
      return;
    }
    const instagram = socialUrl(url, "instagram");
    if (instagram) {
      push({ id: `${post.id}-ig-${instagram}`, kind: "instagram", text, date, mediaUrl: instagram, thumb: null, embed: instagramEmbed(instagram), file: false, href, source, ownId: null, ratio: "original", postedAt: "" });
    }
  };

  const cover = post.featuredEmbed;
  if (cover?.type === "image") addImage(cover.url);
  if (cover?.type === "youtube" || cover?.type === "vimeo") addVideo(cover.url);
  if (cover?.type === "x") addSocial(cover.url);
  addVideo(post.youtubeUrl);
  if (post.fileKind === "image") addImage(post.fileUrl);
  for (const entry of post.inlineMedia ?? []) {
    if (entry.type === "image") addImage(entry.url);
    if (entry.type === "youtube" || entry.type === "vimeo") addVideo(entry.url);
    if (entry.type === "x") addSocial(entry.url);
    if (entry.type === "carousel") {
      for (const item of entry.items) {
        if (item.type === "image") addImage(item.url);
        if (item.type === "youtube") addVideo(item.url);
        if (item.type === "x") addSocial(item.url);
      }
    }
  }
  for (const match of textOf(post.description).matchAll(/https?:\/\/[^\s"'<>]+/gi)) addSocial(match[0]);
  return out;
}

function fromProject(project: Project, titleOf: (value: Translatable | undefined, fallback: string) => string): LightCard | null {
  const watchUrl = youtube(project.videoUrl) || (project.mediaType === "youtube" ? null : fileVideo(project.videoUrl));
  if (!watchUrl || project.mediaType === "image") return null;
  return videoCard({
    id: `work-project-${project.id}`,
    text: titleOf(project.title, "Vidéo"),
    date: "",
    href: `/projets/${project.id}`,
    source: "Work",
    watchUrl,
  });
}

function fromFeature(video: FeatureVideo | MainShowreel, id: string, titleOf: (value: Translatable | undefined, fallback: string) => string): LightCard | null {
  if (video.videoType === "none" || video.videoType === "x") return null;
  const watchUrl = youtube(video.videoUrl) || fileVideo(video.videoUrl);
  if (!watchUrl) return null;
  return videoCard({ id, text: titleOf(video.title, "Vidéo"), date: "", href: "/work", source: "Work", watchUrl });
}

export function instagramEmbed(url: string) {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  if (!match) return null;
  const kind = /\/reel\//i.test(url) ? "reel" : "p";
  return `https://www.instagram.com/${kind}/${match[1]}/embed`;
}

function fromNote(note: LightNote, order = 0): LightCard {
  const url = note.url;
  const postedAt = note.postedAt || `${note.date || "1970-01-01"}T00:00:00.${String(order).padStart(6, "0")}Z`;
  if (note.kind === "video" && url) {
    const card = videoCard({ id: note.id, text: note.text, date: note.date, href: null, source: null, watchUrl: url });
    if (card) return { ...card, id: note.id, ownId: note.id, ratio: ratioOf(note.ratio), postedAt };
    return { id: note.id, kind: "video", text: note.text, date: note.date, mediaUrl: url, thumb: null, embed: null, file: true, href: null, source: null, ownId: note.id, ratio: ratioOf(note.ratio), postedAt };
  }
  if (note.kind === "instagram" && url) {
    return { id: note.id, kind: "instagram", text: note.text, date: note.date, mediaUrl: url, thumb: null, embed: instagramEmbed(url), file: false, href: null, source: null, ownId: note.id, ratio: ratioOf(note.ratio), postedAt };
  }
  return {
    id: note.id,
    kind: note.kind,
    text: note.text,
    date: note.date,
    mediaUrl: url,
    thumb: note.kind === "image" ? url : null,
    embed: null,
    file: note.kind === "video",
    href: null,
    source: null,
    ownId: note.id,
    ratio: ratioOf(note.ratio),
    postedAt,
  };
}

export function collectLightCards(input: {
  posts: SocialPost[];
  projects: Project[];
  notes?: LightNote[];
  showreel?: MainShowreel | null;
  features?: FeatureVideo[];
  titleOf: (value: Translatable | undefined, fallback: string) => string;
  includeHidden?: boolean;
}): LightCard[] {
  const seen = new Set<string>();
  const list: LightCard[] = [];
  const push = (entry: LightCard | LightCard[] | null) => {
    for (const one of Array.isArray(entry) ? entry : entry ? [entry] : []) {
      const key = one.ownId || one.mediaUrl || one.id;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(one);
    }
  };

  const notes = input.notes ?? [];
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index];
    if (!input.includeHidden && note.visible === false) continue;
    push(fromNote(note, notes.length - index));
  }
  for (const post of input.posts) {
    if (!input.includeHidden && post.visible === false) continue;
    push(fromPost(post, input.titleOf));
  }
  for (const project of input.projects) push(fromProject(project, input.titleOf));
  push(input.showreel ? fromFeature(input.showreel, "work-showreel", input.titleOf) : null);
  for (const feature of input.features ?? []) push(fromFeature(feature, `work-feature-${feature.id}`, input.titleOf));

  return list.sort((a, b) => (b.postedAt || b.date || "").localeCompare(a.postedAt || a.date || ""));
}

import type { FeatureVideo, MainShowreel, Project, SocialPost, Translatable } from "@/lib/types";
import { youtubeEmbedUrl, youtubeThumb, youtubeVideoId } from "@/lib/utils";

export type LightCategory = "notes" | "air" | "work";

export type LightItem = {
  id: string;
  category: LightCategory;
  title: string;
  date: string;
  href: string;
  watchUrl: string;
  thumb: string | null;
  embed: string | null;
  file: boolean;
};

type TitleOf = (value: Translatable | undefined, fallback: string) => string;

function youtube(url: string | null | undefined) {
  const value = url?.trim();
  return value && youtubeVideoId(value) ? value : null;
}

function fileVideo(url: string | null | undefined) {
  const value = url?.trim();
  if (!value || youtubeVideoId(value)) return null;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(value) || value.includes("/video/upload/")) return value;
  return null;
}

function item(
  partial: Omit<LightItem, "thumb" | "embed" | "file"> & { watchUrl: string },
): LightItem {
  const id = youtubeVideoId(partial.watchUrl);
  return {
    ...partial,
    thumb: id ? youtubeThumb(partial.watchUrl) : null,
    embed: id ? youtubeEmbedUrl(partial.watchUrl) : null,
    file: !id,
  };
}

function textOf(value: Translatable | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.fr || "";
}

function fromPost(post: SocialPost, titleOf: TitleOf): LightItem[] {
  const category: LightCategory = post.universe === "air" ? "air" : "notes";
  const href = category === "air" ? `/air/${post.id}` : `/notes/${post.id}`;
  const base = { category, title: titleOf(post.title, "Vidéo"), date: post.date || "", href };
  const media = new Map((post.inlineMedia ?? []).map((entry) => [entry.id, entry]));
  const order = [...textOf(post.description).matchAll(/\[\[MEDIA:([a-zA-Z0-9_-]+)\]\]/g)].map((match) => match[1]);
  const out: LightItem[] = [];
  const seen = new Set<string>();

  const push = (url: string | null | undefined) => {
    const value = url?.trim();
    if (!value || seen.has(value)) return;
    const clip = youtube(value);
    if (!clip) return;
    seen.add(value);
    out.push(item({ ...base, id: `${category}-${post.id}-${youtubeVideoId(clip)}`, watchUrl: clip }));
  };

  push(post.featuredEmbed?.type === "youtube" ? post.featuredEmbed.url : null);
  push(post.youtubeUrl);
  for (const id of (order.length ? order : [...media.keys()])) {
    const entry = media.get(id);
    if (entry?.type === "youtube") push(entry.url);
  }
  for (const entry of post.inlineMedia ?? []) {
    if (entry.type === "youtube") push(entry.url);
  }
  return out;
}

function fromProject(project: Project, titleOf: TitleOf): LightItem | null {
  const watchUrl = youtube(project.videoUrl) || (project.mediaType === "youtube" ? null : fileVideo(project.videoUrl));
  if (!watchUrl || project.mediaType === "image") return null;
  if (project.mediaType !== "youtube" && !fileVideo(project.videoUrl)) return null;
  return item({
    id: `work-project-${project.id}`,
    category: "work",
    title: titleOf(project.title, "Vidéo"),
    date: "",
    href: `/projets/${project.id}`,
    watchUrl,
  });
}

function fromFeature(video: FeatureVideo | MainShowreel, id: string, titleOf: TitleOf): LightItem | null {
  if (video.videoType === "none" || video.videoType === "x") return null;
  const watchUrl = youtube(video.videoUrl) || fileVideo(video.videoUrl);
  if (!watchUrl) return null;
  return item({
    id,
    category: "work",
    title: titleOf(video.title, "Vidéo"),
    date: "",
    href: "/work",
    watchUrl,
  });
}

export function collectLightItems(input: {
  posts: SocialPost[];
  projects: Project[];
  showreel?: MainShowreel | null;
  features?: FeatureVideo[];
  titleOf: TitleOf;
  includeHidden?: boolean;
}): LightItem[] {
  const seen = new Set<string>();
  const list: LightItem[] = [];
  const push = (entry: LightItem | LightItem[] | null) => {
    const entries = Array.isArray(entry) ? entry : entry ? [entry] : [];
    for (const one of entries) {
      if (seen.has(one.watchUrl)) continue;
      seen.add(one.watchUrl);
      list.push(one);
    }
  };

  for (const post of input.posts) {
    if (!input.includeHidden && post.visible === false) continue;
    push(fromPost(post, input.titleOf));
  }
  for (const project of input.projects) push(fromProject(project, input.titleOf));
  push(input.showreel ? fromFeature(input.showreel, "work-showreel", input.titleOf) : null);
  for (const feature of input.features ?? []) push(fromFeature(feature, `work-feature-${feature.id}`, input.titleOf));

  return list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}
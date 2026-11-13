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

function fromPost(post: SocialPost, titleOf: TitleOf): LightItem | null {
  const inline = post.inlineMedia?.find((media) => media.type === "youtube");
  const watchUrl =
    youtube(post.featuredEmbed?.type === "youtube" ? post.featuredEmbed.url : null) ||
    youtube(post.youtubeUrl) ||
    youtube(inline && inline.type === "youtube" ? inline.url : null);
  if (!watchUrl) return null;
  const category: LightCategory = post.universe === "air" ? "air" : "notes";
  return item({
    id: `${category}-${post.id}`,
    category,
    title: titleOf(post.title, "Vidéo"),
    date: post.date || "",
    href: category === "air" ? `/air/${post.id}` : `/notes/${post.id}`,
    watchUrl,
  });
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
  const push = (entry: LightItem | null) => {
    if (!entry) return;
    const key = entry.watchUrl;
    if (seen.has(key)) return;
    seen.add(key);
    list.push(entry);
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
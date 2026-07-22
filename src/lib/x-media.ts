/**
 * Resolve a direct video URL from an X/Twitter post.
 * Used by feature cards to play video-only (no tweet chrome).
 */

import { xStatusId } from "@/lib/utils";

export type XMediaResult = {
  statusId: string;
  videoUrl: string | null;
  posterUrl: string | null;
  source: "fxtwitter" | "syndication" | "none";
  error?: string;
};

/** react-tweet style syndication token */
function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, "");
}

function pickBestMp4(
  variants: Array<{ url?: string; content_type?: string; contentType?: string; bitrate?: number | null }>
): string | null {
  const mp4s = variants
    .filter((v) => {
      const ct = (v.content_type || v.contentType || "").toLowerCase();
      const url = v.url || "";
      return url && (ct.includes("mp4") || url.includes(".mp4"));
    })
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  return mp4s[0]?.url ?? null;
}

function pickFromUnknown(data: unknown): {
  videoUrl: string | null;
  posterUrl: string | null;
} {
  const raw = JSON.stringify(data);
  // Prefer explicit video.twimg mp4 links
  const twimg = [
    ...raw.matchAll(
      /https:\/\/video\.twimg\.com\/[^"\\]+\.mp4[^"\\]*/g
    ),
  ].map((m) => m[0].replace(/\\u0026/g, "&").replace(/\\/g, ""));

  // Prefer higher quality by filename heuristics (720p/1036x etc. later)
  const videoUrl = twimg.sort((a, b) => b.length - a.length)[0] ?? null;

  const posters = [
    ...raw.matchAll(
      /https:\/\/pbs\.twimg\.com\/[^"\\]+/g
    ),
  ].map((m) => m[0].replace(/\\u0026/g, "&").replace(/\\/g, ""));
  const posterUrl =
    posters.find((p) => p.includes("amplify_video_thumb") || p.includes("ext_tw_video_thumb") || p.includes("tweet_video_thumb")) ||
    posters.find((p) => p.includes("media")) ||
    null;

  return { videoUrl, posterUrl };
}

async function fromFxTwitter(statusId: string): Promise<{
  videoUrl: string | null;
  posterUrl: string | null;
} | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${statusId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; portfolio/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: number;
      tweet?: {
        media?: {
          videos?: Array<{
            url?: string;
            thumbnail_url?: string;
            variants?: Array<{
              url?: string;
              content_type?: string;
              bitrate?: number;
            }>;
          }>;
          all?: Array<{
            type?: string;
            url?: string;
            thumbnail_url?: string;
            variants?: Array<{
              url?: string;
              content_type?: string;
              bitrate?: number;
            }>;
          }>;
        };
        // older shape
        video?: { url?: string; thumbnail_url?: string };
      };
    };
    if (data.code && data.code !== 200) return null;
    const tweet = data.tweet;
    if (!tweet) return null;

    const videos = tweet.media?.videos ?? [];
    if (videos.length > 0) {
      const v = videos[0];
      const fromVariants = v.variants ? pickBestMp4(v.variants) : null;
      return {
        videoUrl: fromVariants || v.url || null,
        posterUrl: v.thumbnail_url || null,
      };
    }

    const all = tweet.media?.all ?? [];
    const videoItem = all.find((m) => m.type === "video" || m.type === "gif");
    if (videoItem) {
      const fromVariants = videoItem.variants
        ? pickBestMp4(videoItem.variants)
        : null;
      return {
        videoUrl: fromVariants || videoItem.url || null,
        posterUrl: videoItem.thumbnail_url || null,
      };
    }

    if (tweet.video?.url) {
      return {
        videoUrl: tweet.video.url,
        posterUrl: tweet.video.thumbnail_url || null,
      };
    }

    // Fallback scan
    return pickFromUnknown(data);
  } catch {
    return null;
  }
}

async function fromSyndication(statusId: string): Promise<{
  videoUrl: string | null;
  posterUrl: string | null;
} | null> {
  try {
    const token = syndicationToken(statusId);
    const urls = [
      `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&lang=en&token=${token}`,
      `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&lang=en&token=1`,
    ];

    for (const url of urls) {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://platform.twitter.com/",
        },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("json")) continue;
      const data = (await res.json()) as {
        mediaDetails?: Array<{
          type?: string;
          media_url_https?: string;
          video_info?: {
            variants?: Array<{
              url?: string;
              content_type?: string;
              bitrate?: number;
            }>;
          };
        }>;
        photos?: Array<{ url?: string }>;
        video?: {
          variants?: Array<{
            src?: string;
            type?: string;
          }>;
          poster?: string;
        };
      };

      // mediaDetails (classic)
      const media = data.mediaDetails?.find(
        (m) => m.type === "video" || m.type === "animated_gif"
      );
      if (media?.video_info?.variants) {
        return {
          videoUrl: pickBestMp4(media.video_info.variants),
          posterUrl: media.media_url_https || null,
        };
      }

      // newer video shape
      if (data.video?.variants?.length) {
        const mp4 = data.video.variants
          .filter((v) => (v.type || "").includes("mp4") || (v.src || "").includes(".mp4"))
          .map((v) => v.src)
          .filter(Boolean) as string[];
        if (mp4[0]) {
          return {
            videoUrl: mp4[0],
            posterUrl: data.video.poster || data.photos?.[0]?.url || null,
          };
        }
      }

      const scanned = pickFromUnknown(data);
      if (scanned.videoUrl) return scanned;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Official X video player page (no tweet text / actions).
 * Used as iframe fallback when we cannot resolve an MP4 URL.
 */
export function xVideoPlayerEmbedUrl(postUrlOrId: string): string | null {
  const id = /^\d+$/.test(postUrlOrId)
    ? postUrlOrId
    : xStatusId(postUrlOrId);
  if (!id) return null;
  return `https://twitter.com/i/videos/tweet/${id}`;
}

export async function resolveXMedia(
  postUrlOrId: string
): Promise<XMediaResult> {
  const statusId = /^\d+$/.test(postUrlOrId)
    ? postUrlOrId
    : xStatusId(postUrlOrId);

  if (!statusId) {
    return {
      statusId: "",
      videoUrl: null,
      posterUrl: null,
      source: "none",
      error: "Lien X invalide",
    };
  }

  // 1) fxtwitter
  const fx = await fromFxTwitter(statusId);
  if (fx?.videoUrl) {
    return {
      statusId,
      videoUrl: fx.videoUrl,
      posterUrl: fx.posterUrl,
      source: "fxtwitter",
    };
  }

  // 2) syndication
  const syn = await fromSyndication(statusId);
  if (syn?.videoUrl) {
    return {
      statusId,
      videoUrl: syn.videoUrl,
      posterUrl: syn.posterUrl,
      source: "syndication",
    };
  }

  return {
    statusId,
    videoUrl: null,
    posterUrl: fx?.posterUrl || syn?.posterUrl || null,
    source: "none",
    error:
      "Vidéo non trouvée pour ce post (privé, sans média, ou API indisponible).",
  };
}


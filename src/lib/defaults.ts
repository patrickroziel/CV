import type { BackgroundImage, PortfolioData } from "./types";
import {
  DATA_VERSION,
  DEFAULT_ALPHA_VIDEO_OPACITY,
  DEFAULT_COMING_SOON,
  DEFAULT_CONTACT,
  DEFAULT_EXPERIENCE_BADGE,
  DEFAULT_EXTRA_DOCUMENTS,
  DEFAULT_HERO_GLASS,
  DEFAULT_NAV,
  DEFAULT_QUOTES,
} from "./types";
import snapshot from "./default-snapshot.json";

/**
 * Production defaults = full portfolio snapshot (Cloudinary media, languages,
 * feature videos, multilingual content). Used when localStorage is empty
 * (first visit / production). Edit mode can still override via localStorage.
 */
const snap = snapshot as unknown as PortfolioData;

export const DEFAULT_BACKGROUND =
  snap.backgroundUrl ||
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=80";

function defaultBackgroundImages(): BackgroundImage[] {
  const fromSnap = snap.backgroundImages;
  if (Array.isArray(fromSnap) && fromSnap.length > 0) {
    const list: BackgroundImage[] = [];
    for (let i = 0; i < fromSnap.length; i++) {
      const img = fromSnap[i];
      const url = (img?.url || "").trim();
      if (!url) continue;
      const alphaVideoUrl =
        typeof img?.alphaVideoUrl === "string" && img.alphaVideoUrl.trim()
          ? img.alphaVideoUrl.trim()
          : null;
      list.push({
        id: img?.id || `bg-default-${i}`,
        url,
        alphaVideoUrl,
        alphaVideoEnabled:
          typeof img?.alphaVideoEnabled === "boolean"
            ? img.alphaVideoEnabled
            : Boolean(alphaVideoUrl),
        alphaVideoOpacity:
          typeof img?.alphaVideoOpacity === "number"
            ? img.alphaVideoOpacity
            : DEFAULT_ALPHA_VIDEO_OPACITY,
      });
    }
    if (list.length > 0) return list;
  }
  const url = (snap.backgroundUrl || DEFAULT_BACKGROUND).trim();
  return [
    {
      id: "bg-default",
      url: url || DEFAULT_BACKGROUND,
      alphaVideoUrl: null,
      alphaVideoEnabled: false,
      alphaVideoOpacity: DEFAULT_ALPHA_VIDEO_OPACITY,
    },
  ];
}

const DEFAULT_BG_IMAGES = defaultBackgroundImages();

export const DEFAULT_PORTFOLIO: PortfolioData = {
  ...snap,
  version: DATA_VERSION,
  backgroundUrl: DEFAULT_BG_IMAGES[0]?.url || DEFAULT_BACKGROUND,
  backgroundImages: DEFAULT_BG_IMAGES,
  profile: {
    ...snap.profile,
    experienceBadge:
      (snap.profile as { experienceBadge?: unknown })?.experienceBadge ??
      DEFAULT_EXPERIENCE_BADGE,
  },
  heroGlass: structuredClone(
    (snap as { heroGlass?: typeof DEFAULT_HERO_GLASS }).heroGlass ??
      DEFAULT_HERO_GLASS
  ),
  // Prefer baked snapshot content (showreel / features / quotes) for production
  mainShowreel: structuredClone(snap.mainShowreel),
  featureVideos: structuredClone(snap.featureVideos ?? []),
  quotes: structuredClone(snap.quotes ?? DEFAULT_QUOTES),
  nav: structuredClone(
    (snap as { nav?: typeof DEFAULT_NAV }).nav ?? DEFAULT_NAV
  ),
  comingSoon: {
    ...structuredClone(
      (snap as { comingSoon?: typeof DEFAULT_COMING_SOON }).comingSoon ??
        DEFAULT_COMING_SOON
    ),
    // Production public landing until explicitly published OFF
    enabled: true,
  },
  contact: {
    ...DEFAULT_CONTACT,
    ...snap.contact,
    extraDocuments: {
      personalCv: {
        ...DEFAULT_EXTRA_DOCUMENTS.personalCv,
        ...snap.contact?.extraDocuments?.personalCv,
      },
      portfolioPdf: {
        ...DEFAULT_EXTRA_DOCUMENTS.portfolioPdf,
        ...snap.contact?.extraDocuments?.portfolioPdf,
      },
      businessCard: {
        ...DEFAULT_EXTRA_DOCUMENTS.businessCard,
        ...snap.contact?.extraDocuments?.businessCard,
      },
    },
  },
};

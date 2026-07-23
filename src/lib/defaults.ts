import type { PortfolioData } from "./types";
import { DATA_VERSION } from "./types";
import snapshot from "./default-snapshot.json";

/**
 * Production defaults = full portfolio snapshot (Cloudinary media, languages,
 * feature videos, multilingual content). Used when localStorage is empty
 * (first visit / production). Edit mode can still override via localStorage.
 */
export const DEFAULT_BACKGROUND =
  (snapshot as PortfolioData).backgroundUrl ||
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=80";

export const DEFAULT_PORTFOLIO: PortfolioData = {
  ...(snapshot as unknown as PortfolioData),
  version: DATA_VERSION,
};

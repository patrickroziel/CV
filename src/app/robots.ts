import type { MetadataRoute } from "next";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/behind-the-glass", "/branding-preview"],
    },
    sitemap: `${NOTES_ORIGIN}/sitemap.xml`,
    host: NOTES_ORIGIN,
  };
}

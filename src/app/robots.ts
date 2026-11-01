import type { MetadataRoute } from "next";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const SOCIAL_CRAWLERS = [
  "LinkedInBot",
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "TelegramBot",
  "Slackbot",
  "Pinterest",
  "Discordbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: SOCIAL_CRAWLERS,
        allow: ["/", "/api/notes/"],
        disallow: ["/behind-the-glass", "/branding-preview"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/behind-the-glass", "/branding-preview"],
      },
    ],
    sitemap: `${NOTES_ORIGIN}/sitemap.xml`,
    host: NOTES_ORIGIN,
  };
}

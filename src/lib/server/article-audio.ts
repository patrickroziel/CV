import "server-only";

import { createHash } from "node:crypto";
import { list, put } from "@vercel/blob";
import { GoogleAuth } from "google-auth-library";
import { getL } from "@/lib/i18n-content";
import { stripHtml } from "@/lib/sanitize-html";
import type { SocialPost } from "@/lib/types";

const MAX_ARTICLE_CHARS = 40_000;
const MAX_CHUNK_BYTES = 4_800;

type VoiceGender = "male" | "female";
type SupportedLocale = "fr" | "en" | "es" | "pl";

const GOOGLE_VOICES: Record<SupportedLocale, { languageCode: string; male: string; female: string }> = {
  fr: { languageCode: "fr-FR", male: "fr-FR-Neural2-G", female: "fr-FR-Neural2-F" },
  en: { languageCode: "en-US", male: "en-US-Neural2-D", female: "en-US-Neural2-F" },
  es: { languageCode: "es-ES", male: "es-ES-Neural2-B", female: "es-ES-Neural2-C" },
  pl: { languageCode: "pl-PL", male: "pl-PL-Neural2-B", female: "pl-PL-Neural2-A" },
};

function localized(value: SocialPost["description"]): { text: string; locale: SupportedLocale } {
  if (typeof value === "string") return { text: value, locale: "fr" };
  const entries = (["fr", "en", "es", "pl"] as const)
    .map((locale) => ({ locale, text: value?.[locale] ?? "" }))
    .filter((entry) => entry.text.trim());
  if (!entries.length) return { text: "", locale: "fr" };
  // Speak the most complete authored translation rather than guessing from words.
  entries.sort((a, b) => b.text.length - a.text.length);
  return entries[0];
}

function splitText(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const pushLongParagraph = (paragraph: string) => {
    let rest = paragraph;
    while (Buffer.byteLength(rest, "utf8") > MAX_CHUNK_BYTES) {
      let cut = Math.min(rest.length, MAX_CHUNK_BYTES);
      while (cut > 0 && Buffer.byteLength(rest.slice(0, cut), "utf8") > MAX_CHUNK_BYTES) cut -= 100;
      const boundary = rest.lastIndexOf(" ", cut);
      if (boundary > cut * 0.6) cut = boundary;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  };

  for (const paragraph of paragraphs) {
    const candidate = current ? current + "\n\n" + paragraph : paragraph;
    if (Buffer.byteLength(candidate, "utf8") <= MAX_CHUNK_BYTES) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = "";
      if (Buffer.byteLength(paragraph, "utf8") <= MAX_CHUNK_BYTES) current = paragraph;
      else pushLongParagraph(paragraph);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function articleText(post: SocialPost): { text: string; locale: SupportedLocale } {
  const { text: raw, locale } = localized(post.description);
  const title = getL(post.title, locale);
  const subtitle = post.subtitle ? getL(post.subtitle, locale) : "";
  const body = stripHtml(raw)
    .replace(/\[\[MEDIA:[a-zA-Z0-9_-]{8,80}\]\]/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    text: [title, subtitle, body].filter(Boolean).join("\n\n").slice(0, MAX_ARTICLE_CHARS),
    locale,
  };
}

async function cachedAudio(pathname: string): Promise<Buffer | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const result = await list({ prefix: pathname, limit: 5 });
    const blob = result.blobs.find((item) => item.pathname === pathname);
    if (!blob) return null;
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function cacheAudio(pathname: string, audio: Buffer): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await put(pathname, audio, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "audio/mpeg",
      cacheControlMaxAge: 31_536_000,
    });
  } catch (error) {
    console.error("[article-audio] Blob cache write failed:", error);
  }
}

async function synthesize(text: string, locale: SupportedLocale, gender: VoiceGender): Promise<Buffer> {
  const rawCredentials = process.env.GOOGLE_CLOUD_TTS_CREDENTIALS;
  if (!rawCredentials) throw new Error("La configuration Google Cloud Text-to-Speech n'est pas encore installée.");

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(rawCredentials) as Record<string, unknown>;
  } catch {
    throw new Error("La configuration des identifiants Google Cloud est invalide.");
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Authentification Google Cloud impossible.");

  const voice = GOOGLE_VOICES[locale];
  const chunks = splitText(text);
  const audioParts: Buffer[] = [];

  for (const chunk of chunks) {
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text: chunk },
        voice: {
          languageCode: voice.languageCode,
          name: voice[gender],
        },
        audioConfig: { audioEncoding: "MP3" },
      }),
      cache: "no-store",
    });

    const payload = await response.json() as { audioContent?: string; error?: { message?: string } };
    if (!response.ok || !payload.audioContent) {
      throw new Error(payload.error?.message || "Google Cloud n'a pas pu générer cet audio.");
    }
    audioParts.push(Buffer.from(payload.audioContent, "base64"));
  }

  return Buffer.concat(audioParts);
}

export async function getArticleAudio(post: SocialPost, gender: VoiceGender): Promise<Buffer> {
  const { text, locale } = articleText(post);
  if (!text.trim()) throw new Error("Cet article ne contient pas de texte à lire.");
  if (text.length >= MAX_ARTICLE_CHARS) {
    throw new Error("Cet article est trop long pour être converti en une seule lecture audio.");
  }

  const hash = createHash("sha256")
    .update(JSON.stringify({ id: post.id, text, locale, gender, version: 1 }))
    .digest("hex");
  const pathname = `patrick-roziel/audio-articles/${hash}.mp3`;

  const cached = await cachedAudio(pathname);
  if (cached) return cached;

  const audio = await synthesize(text, locale, gender);
  await cacheAudio(pathname, audio);
  return audio;
}

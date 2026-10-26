import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/JsonLd";
import { EntryReader } from "@/components/notes/EntryReader";
import {
  getNoteSharePhoto,
  getNoteShareText,
  getPublicNote,
  NOTES_ORIGIN,
  titleForSearch,
} from "@/lib/server/notes-sharing";

// Published content lives in Neon and can change without a code deployment.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NoteParams = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ share?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: NoteParams): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);

  if (!post || post.universe === "air") {
    // Never reveal titles, descriptions or draft images in public previews.
    return {
      title: "Publication indisponible — Patrick Roziel",
      description: "Cette publication n'est pas disponible.",
      robots: { index: false, follow: false },
    };
  }

  const { title, description } = getNoteShareText(post);
  const url = `${NOTES_ORIGIN}/notes/${encodeURIComponent(id)}`;
  // Give X a distinct URL for each voluntary share so it can re-fetch stale
  // preview data. Keep the page's SEO canonical on the clean, stable URL.
  const query = await searchParams;
  const share = typeof query?.share === "string" && /^[a-z0-9]{8,24}$/.test(query.share)
    ? query.share
    : null;
  const shareUrl = share ? `${url}?share=${share}` : url;
  const image = getNoteSharePhoto(post) ??
    `${NOTES_ORIGIN}/api/notes/${encodeURIComponent(id)}/share-image`;

  return {
    metadataBase: new URL(NOTES_ORIGIN),
    title: `${titleForSearch(title)} — Patrick Roziel`,
    description,
    alternates: { canonical: url },
    robots: share
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "Patrick Roziel — Notes",
      url: shareUrl,
      title,
      description,
      images: [{ url: image, alt: `Aperçu de ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BookChapterPage({ params }: NoteParams) {
  const { id } = await params;
  const post = await getPublicNote(id);
  const article = post && post.universe !== "air" ? post : null;
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      {article ? <ArticleJsonLd post={article} path={`/notes/${id}`} section="Notes" /> : null}
      <EntryReader id={id} initialPost={article} />
    </main>
  );
}

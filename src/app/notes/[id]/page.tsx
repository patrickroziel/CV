import type { Metadata } from "next";
import { EntryReader } from "@/components/notes/EntryReader";
import {
  getNoteSharePhoto,
  getNoteShareText,
  getPublicNote,
  NOTES_ORIGIN,
} from "@/lib/server/notes-sharing";

// Published content lives in Neon and can change without a code deployment.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NoteParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: NoteParams): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);

  if (!post) {
    // Never reveal titles, descriptions or draft images in public previews.
    return {
      title: "Publication indisponible — Patrick Roziel",
      description: "Cette publication n'est pas disponible.",
      robots: { index: false, follow: false },
    };
  }

  const { title, description } = getNoteShareText(post);
  const url = `${NOTES_ORIGIN}/notes/${encodeURIComponent(id)}`;
  const image = getNoteSharePhoto(post) ??
    `${NOTES_ORIGIN}/api/notes/${encodeURIComponent(id)}/share-image`;

  return {
    metadataBase: new URL(NOTES_ORIGIN),
    title: `${title} — Patrick Roziel`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "Patrick Roziel — Notes",
      url,
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
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <EntryReader id={id} />
    </main>
  );
}

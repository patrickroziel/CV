import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/JsonLd";
import { EntryReader } from "@/components/notes/EntryReader";
import {
  getNoteSharePhoto,
  getNoteShareText,
  getPublicNote,
  listPublicPosts,
  NOTES_ORIGIN,
  titleForSearch,
} from "@/lib/server/notes-sharing";
import { shareImageUrl } from "@/lib/server/share-locale";

// Published content lives in Neon. Public HTML can lag a save by one minute.
// Query strings are ignored on purpose: reading them made every article dynamic
// and forced a fresh database read on each visit.
export const runtime = "nodejs";
export const revalidate = 60;

type NoteParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: NoteParams): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);

  if (!post || post.universe === "air") {
    return {
      title: "Publication indisponible — Patrick Roziel",
      description: "Cette publication n'est pas disponible.",
      robots: { index: false, follow: false },
    };
  }

  const french = getNoteShareText(post);
  const url = `${NOTES_ORIGIN}/notes/${encodeURIComponent(id)}`;
  const subtitle = french.subtitle;
  const cardText = subtitle || french.description;
  const linkTitle = subtitle ? `${french.title} — ${subtitle}` : french.title;
  const image = shareImageUrl(id, null, getNoteSharePhoto(post));

  return {
    metadataBase: new URL(NOTES_ORIGIN),
    title: `${titleForSearch(french.title)} — Patrick Roziel`,
    description: french.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "Patrick Roziel — Notes",
      url,
      title: linkTitle,
      description: cardText,
      images: [{
        url: image,
        secureUrl: image,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: french.title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: linkTitle,
      description: cardText,
      images: [image],
    },
  };
}

export default async function BookChapterPage({ params }: NoteParams) {
  const { id } = await params;
  const posts = await listPublicPosts();
  const post = posts.find((item) => item.id === id) ?? null;
  const article = post && post.universe !== "air" ? post : null;
  const notes = posts.filter((item) => item.universe !== "air");
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      {article ? <ArticleJsonLd post={article} path={`/notes/${id}`} section="Notes" /> : null}
      <EntryReader id={id} initialPost={article} seedPosts={notes} />
    </main>
  );
}

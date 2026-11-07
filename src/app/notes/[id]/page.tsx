import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/JsonLd";
import { EntryReader } from "@/components/notes/EntryReader";
import {
  getNoteShareText,
  getPublicNote,
  listPublicPosts,
  NOTES_ORIGIN,
  titleForSearch,
} from "@/lib/server/notes-sharing";
import { openGraphLocale, requestedShareLanguage, shareImageUrl, translateShareText } from "@/lib/server/share-locale";

// Published content lives in Neon. Public HTML can lag a save by one minute.
export const runtime = "nodejs";
export const revalidate = 60;

type NoteParams = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ share?: string | string[]; lang?: string | string[] }>;
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

  const french = getNoteShareText(post);
  const url = `${NOTES_ORIGIN}/notes/${encodeURIComponent(id)}`;
  // Give X and Facebook a distinct URL for each voluntary share so they can
  // re-fetch stale preview data. Keep the page's SEO canonical on the clean URL.
  const query = await searchParams;
  const share = typeof query?.share === "string" && /^[a-z0-9]{8,24}$/.test(query.share)
    ? query.share
    : null;
  const lang = requestedShareLanguage(query?.lang);
  const { title, description } = await translateShareText(french.title, french.description, lang);
  const subtitle = french.subtitle
    ? (await translateShareText(french.subtitle, french.subtitle, lang)).title
    : "";
  const cardText = subtitle || description;
  const linkTitle = subtitle ? `${title} — ${subtitle}` : title;
  const preview = new URL(url);
  if (share) preview.searchParams.set("share", share);
  if (lang) preview.searchParams.set("lang", lang);
  const image = shareImageUrl(id, lang);

  return {
    metadataBase: new URL(NOTES_ORIGIN),
    title: `${titleForSearch(title)} — Patrick Roziel`,
    description,
    alternates: { canonical: lang ? preview.toString() : url },
    robots: share || lang
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: openGraphLocale(lang),
      siteName: "Patrick Roziel — Notes",
      url: preview.toString(),
      title: linkTitle,
      description: cardText,
      images: [{
        url: image,
        secureUrl: image,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: title,
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

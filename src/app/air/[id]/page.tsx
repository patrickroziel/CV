import type { Metadata } from "next";
import { getPublicNote, getNoteSharePhoto, getNoteShareText, listPublicPosts, NOTES_ORIGIN, titleForSearch } from "@/lib/server/notes-sharing";
import { shareImageUrl } from "@/lib/server/share-locale";
import { AirArticle } from "@/components/air/AirArticle";
import { ArticleJsonLd } from "@/components/seo/JsonLd";

export const runtime = "nodejs";
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post || post.universe !== "air") return { title: "Article indisponible — Air", robots: { index: false, follow: false } };
  const french = getNoteShareText(post);
  const url = `${NOTES_ORIGIN}/air/${encodeURIComponent(id)}`;
  const image = shareImageUrl(id, null);
  const imageType = getNoteSharePhoto(post) ? "image/jpeg" : "image/png";
  return {
    title: `${titleForSearch(french.title)} — Air · Patrick Roziel`,
    description: french.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title: french.title,
      description: french.description,
      locale: "fr_FR",
      siteName: "Patrick Roziel — Air",
      images: [{
        url: image,
        secureUrl: image,
        width: 1200,
        height: 630,
        type: imageType,
        alt: french.title,
      }],
    },
    twitter: { card: "summary_large_image", title: french.title, description: french.description, images: [image] },
  };
}

export default async function AirArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const posts = await listPublicPosts();
  const post = posts.find((item) => item.id === id) ?? null;
  const article = post && post.universe === "air" ? post : null;
  const air = posts.filter((item) => item.universe === "air");
  return (
    <main className="relative z-10 min-h-screen pb-24 pt-24 sm:pt-28">
      {article ? <ArticleJsonLd post={article} path={`/air/${id}`} section="Air" /> : null}
      <AirArticle id={id} initialPost={article} seedPosts={air} />
    </main>
  );
}

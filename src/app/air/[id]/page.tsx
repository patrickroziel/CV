import type { Metadata } from "next";
import { getPublicNote, getNoteShareText, getNoteSharePhoto, listPublicPosts, NOTES_ORIGIN, titleForSearch } from "@/lib/server/notes-sharing";
import { AirArticle } from "@/components/air/AirArticle";
import { ArticleJsonLd } from "@/components/seo/JsonLd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post || post.universe !== "air") return { title: "Article indisponible — Air", robots: { index: false, follow: false } };
  const { title, description } = getNoteShareText(post);
  const image = getNoteSharePhoto(post) ?? `${NOTES_ORIGIN}/api/notes/${encodeURIComponent(id)}/share-image`;
  const url = `${NOTES_ORIGIN}/air/${encodeURIComponent(id)}`;
  return {
    title: `${titleForSearch(title)} — Air · Patrick Roziel`,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      locale: "fr_FR",
      siteName: "Patrick Roziel — Air",
      images: [{ url: image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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

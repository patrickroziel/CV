import type { Metadata } from "next";
import { getPublicNote, getNoteSharePhoto, getNoteShareText, listPublicPosts, NOTES_ORIGIN, titleForSearch } from "@/lib/server/notes-sharing";
import { openGraphLocale, requestedShareLanguage, shareImageUrl, translateShareText } from "@/lib/server/share-locale";
import { AirArticle } from "@/components/air/AirArticle";
import { ArticleJsonLd } from "@/components/seo/JsonLd";

export const runtime = "nodejs";
export const revalidate = 60;
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ share?: string | string[]; lang?: string | string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post || post.universe !== "air") return { title: "Article indisponible — Air", robots: { index: false, follow: false } };
  const french = getNoteShareText(post);
  const query = await searchParams;
  const share = typeof query?.share === "string" && /^[a-z0-9]{8,24}$/.test(query.share) ? query.share : null;
  const lang = requestedShareLanguage(query?.lang);
  const { title, description } = await translateShareText(french.title, french.description, lang);
  const url = `${NOTES_ORIGIN}/air/${encodeURIComponent(id)}`;
  const preview = new URL(url);
  if (share) preview.searchParams.set("share", share);
  if (lang) preview.searchParams.set("lang", lang);
  const image = shareImageUrl(id, lang);
  const imageType = getNoteSharePhoto(post) ? "image/jpeg" : "image/png";
  return {
    title: `${titleForSearch(title)} — Air · Patrick Roziel`,
    description,
    alternates: { canonical: lang ? preview.toString() : url },
    robots: share || lang ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: "article",
      url: preview.toString(),
      title,
      description,
      locale: openGraphLocale(lang),
      siteName: "Patrick Roziel — Air",
      images: [{
        url: image,
        secureUrl: image,
        width: 1200,
        height: 630,
        type: imageType,
        alt: title,
      }],
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

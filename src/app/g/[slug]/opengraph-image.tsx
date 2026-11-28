import { getPublicGhost, ghostShareText } from "@/lib/server/ghost-pages";
import { renderShareImage } from "@/lib/og/share-card";

export const runtime = "nodejs";
export const revalidate = 21600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function GhostOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicGhost(slug);
  if (!page) return new Response("Page indisponible", { status: 404 });
  const { title, description } = ghostShareText(page);

  return renderShareImage({
    title,
    subtitle: description,
    width: size.width,
    height: size.height,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=21600, stale-while-revalidate=604800" },
  });
}

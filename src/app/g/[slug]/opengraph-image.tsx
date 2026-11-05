import { ImageResponse } from "next/og";
import { getPublicGhost, ghostShareText } from "@/lib/server/ghost-pages";

export const runtime = "nodejs";
export const revalidate = 60;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function GhostOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicGhost(slug);
  if (!page) return new Response("Page indisponible", { status: 404 });
  const { title, description } = ghostShareText(page);

  return new ImageResponse(
    (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "68px 78px",
        backgroundColor: "#05070d",
        backgroundImage: "linear-gradient(125deg, rgba(8,14,24,0.2) 0%, rgba(8,18,32,0.55) 42%, rgba(28,18,10,0.45) 100%), radial-gradient(circle at 18% 78%, rgba(130,190,220,0.35), transparent 28%), radial-gradient(circle at 82% 24%, rgba(214,176,110,0.28), transparent 26%)",
        color: "#f6f3ee",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, color: "#e6d3ae", fontWeight: 700 }}>
          PATRICK ROZIEL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: title.length > 42 ? 58 : 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5, maxHeight: 230, overflow: "hidden" }}>
            {title.slice(0, 90)}
          </div>
          <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, color: "#d5dde3", maxHeight: 120, overflow: "hidden" }}>
            {description.slice(0, 160)}
          </div>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid rgba(230,211,174,0.35)", paddingTop: 22, fontSize: 22, color: "#efe4cf" }}>
          {`patrickroziel.com/g/${page.slug}`}
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=0, s-maxage=300" } },
  );
}

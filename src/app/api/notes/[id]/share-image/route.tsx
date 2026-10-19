import { ImageResponse } from "next/og";
import { getNoteShareText, getPublicNote } from "@/lib/server/notes-sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Branded 1200×630 fallback for text-only Notes posts shared on X. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPublicNote(id);
  if (!post) return new Response("Publication indisponible", { status: 404 });

  const { title, description } = getNoteShareText(post);

  return new ImageResponse(
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      height: "100%", width: "100%", padding: "65px 76px",
      backgroundColor: "#051b23",
      backgroundImage: "linear-gradient(130deg, #06141d 0%, #11313d 58%, #231723 100%)",
      color: "#f3f6f6", fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, backgroundColor: "#83e4e3" }} />
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#b9dddf", fontWeight: 600 }}>
          NOTES / PATRICK ROZIEL
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, flexGrow: 1, justifyContent: "center" }}>
        <div style={{
          display: "flex", fontWeight: 700, fontSize: title.length > 65 ? 50 : 64,
          lineHeight: 1.12, overflow: "hidden", maxHeight: 234,
          letterSpacing: -1.5, overflowWrap: "break-word",
        }}>
          {title.slice(0, 110)}
        </div>
        <div style={{
          display: "flex", fontSize: 26, color: "#b6c5c9", lineHeight: 1.35,
          overflow: "hidden", maxHeight: 106,
        }}>
          {description.slice(0, 160)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #45606a", paddingTop: 24 }}>
        <div style={{ display: "flex", fontSize: 22, color: "#ace4e3" }}>patrickroziel.com</div>
        <div style={{ display: "flex", fontSize: 18, color: "#99aab2" }}>WORK & NOTES</div>
      </div>
    </div>,
    {
      width: 1200, height: 630,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=300" },
    },
  );
}

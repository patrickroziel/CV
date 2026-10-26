import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Patrick Roziel — Notes, Air et Work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          width: "100%",
          padding: "72px 80px",
          backgroundImage: "linear-gradient(135deg, #021016 0%, #0c3340 55%, #1c1420 100%)",
          color: "#f4f7f7",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#8ef0ea" }} />
          <div style={{ fontSize: 22, letterSpacing: 5, color: "#b7e4e2", fontWeight: 700 }}>
            PATRICK ROZIEL
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 68, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05 }}>
            Notes, Air & Work
          </div>
          <div style={{ fontSize: 30, color: "#c5d4d6", maxWidth: 860, lineHeight: 1.35 }}>
            Écrits, décryptages et portfolio de montage vidéo.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #3d5c66",
            paddingTop: 24,
            fontSize: 22,
            color: "#9fdcd8",
          }}
        >
          <div style={{ display: "flex" }}>patrickroziel.com</div>
          <div style={{ display: "flex", color: "#9aadb3" }}>La Courneuve · France</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

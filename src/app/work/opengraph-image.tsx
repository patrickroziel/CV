import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Patrick Roziel — profil professionnel, monteur vidéo et motion designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function WorkShareCard() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
        padding: "68px 76px",
        backgroundImage: "linear-gradient(145deg, #07140f 0%, #12352a 58%, #1b2416 100%)",
        color: "#f4f7f4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#c8f5d4" }} />
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#d7f5e2", fontWeight: 700 }}>WORK</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>Patrick Roziel</div>
        <div style={{ fontSize: 34, color: "#d5e6da", lineHeight: 1.3 }}>Monteur vidéo et motion designer</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(200,245,212,0.28)",
          paddingTop: 24,
          fontSize: 24,
          color: "#c8f5d4",
        }}
      >
        <div style={{ display: "flex" }}>patrickroziel.com/work</div>
        <div style={{ display: "flex", color: "#b7c9be" }}>La Courneuve · France</div>
      </div>
    </div>
  );
}

export default function WorkOpenGraphImage() {
  return new ImageResponse(<WorkShareCard />, { ...size });
}

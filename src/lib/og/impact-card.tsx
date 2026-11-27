import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const shareSize = { width: 1200, height: 630 };

async function impactFonts() {
  const data = await readFile(join(process.cwd(), "src/app/fonts/Anton-Regular.ttf"));
  return [{ name: "Impact", data, weight: 400 as const, style: "normal" as const }];
}

export async function impactImage(title: string, subtitle: string) {
  const headline = title.toLocaleUpperCase("fr-FR");
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
          fontFamily: "Impact",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#8ef0ea" }} />
          <div style={{ fontSize: 22, letterSpacing: 5, color: "#b7e4e2" }}>PATRICK ROZIEL</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 84, lineHeight: 0.95, letterSpacing: 1 }}>{headline}</div>
          <div style={{ fontSize: 32, color: "#c5d4d6", lineHeight: 1.3, maxWidth: 980 }}>{subtitle}</div>
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
    { ...shareSize, fonts: await impactFonts() },
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { layoutShareText } from "@/lib/og/share-layout";

async function shareFonts() {
  const data = await readFile(join(process.cwd(), "src/app/fonts/Anton-Regular.ttf"));
  return [{ name: "Anton", data, weight: 400 as const, style: "normal" as const }];
}

export function ShareCard({
  title,
  subtitle = "",
  width,
  height,
  photo,
}: {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  photo?: string | null;
}) {
  const layout = layoutShareText(title, subtitle, width, height);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#071016",
        color: "#ffffff",
        fontFamily: "Anton",
        backgroundImage: photo
          ? `url(${photo})`
          : "linear-gradient(145deg, #07141c 0%, #12323a 55%, #1a1824 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: photo ? "rgba(4, 10, 16, 0.46)" : "rgba(4, 10, 16, 0.18)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          position: "relative",
          width: "100%",
          height: "100%",
          padding: `${layout.marginY}px ${layout.marginX}px`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: layout.innerW }}>
          {layout.titleLines.map((line, index) => (
            <div
              key={`t-${index}`}
              style={{
                display: "flex",
                fontSize: layout.titleSize,
                lineHeight: 1,
                letterSpacing: 0.4,
                color: "#ffffff",
                fontFamily: "Anton",
                marginBottom: index < layout.titleLines.length - 1 ? Math.round(layout.titleSize * 0.28) : 0,
              }}
            >
              {line}
            </div>
          ))}
          {layout.subLines.length ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: layout.gap, maxWidth: layout.innerW }}>
              {layout.subLines.map((line, index) => (
                <div
                  key={`s-${index}`}
                  style={{
                    display: "flex",
                    fontSize: layout.subSize,
                    lineHeight: 1,
                    letterSpacing: 0.3,
                    color: "#ffffff",
                    fontFamily: "Anton",
                    marginBottom: index < layout.subLines.length - 1 ? Math.round(layout.subSize * 0.22) : 0,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export async function renderShareImage({
  title,
  subtitle = "",
  width,
  height,
  photo = null,
  headers,
}: {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  photo?: string | null;
  headers?: Record<string, string>;
}) {
  return new ImageResponse(
    <ShareCard title={title} subtitle={subtitle} width={width} height={height} photo={photo} />,
    { width, height, fonts: await shareFonts(), headers },
  );
}

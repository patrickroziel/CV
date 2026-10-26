import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#03141a",
          color: "#9ff3ef",
          fontSize: 72,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
          letterSpacing: -2,
        }}
      >
        PR
      </div>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { WorkShareCard } from "./opengraph-image";

export const runtime = "nodejs";
export const alt = "Patrick Roziel — profil professionnel, monteur vidéo et motion designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function WorkTwitterImage() {
  return new ImageResponse(<WorkShareCard />, { ...size });
}

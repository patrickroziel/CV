import { impactImage, shareSize } from "@/lib/og/impact-card";

export const runtime = "nodejs";
export const alt = "LIGHTS — Fil de médias";
export const size = shareSize;
export const contentType = "image/png";

export default function LightsOpenGraphImage() {
  return impactImage("Lights", "Citations, images, vidéos et posts.");
}

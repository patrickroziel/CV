import { impactImage, shareSize } from "@/lib/og/impact-card";

export const runtime = "nodejs";
export const alt = "Patrick Roziel — Notes, Scope et Work";
export const size = shareSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return impactImage("Notes, Scope & Work", "Écrits, décryptages et portfolio de montage vidéo.");
}

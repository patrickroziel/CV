import { renderShareImage } from "@/lib/og/share-card";

export const runtime = "nodejs";
export const alt = "Patrick Roziel — profil professionnel, monteur vidéo et motion designer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function WorkTwitterImage() {
  return renderShareImage({
    title: "Patrick Roziel",
    subtitle: "Monteur vidéo et motion designer",
    width: size.width,
    height: size.height,
  });
}

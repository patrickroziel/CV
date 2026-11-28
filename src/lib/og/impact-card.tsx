import { renderShareImage } from "@/lib/og/share-card";

export const shareSize = { width: 1200, height: 630 };

export function impactImage(title: string, subtitle: string) {
  return renderShareImage({ title, subtitle, width: shareSize.width, height: shareSize.height });
}

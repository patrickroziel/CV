import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Projets de montage & motion design — Patrick Roziel";
const description =
  "Galerie de projets de Patrick Roziel : montage vidéo, motion design, showreel, social media et réalisations pour le web et la communication. La Courneuve (93).";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["projets", "montage vidéo", "motion design", "showreel", "portfolio", "Patrick Roziel"],
  alternates: { canonical: `${NOTES_ORIGIN}/projets` },
  openGraph: {
    type: "website",
    url: `${NOTES_ORIGIN}/projets`,
    title,
    description,
    siteName: "Patrick Roziel",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function ProjetsLayout({ children }: { children: ReactNode }) {
  return children;
}

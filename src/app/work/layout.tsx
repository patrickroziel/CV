import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Patrick Roziel — Monteur vidéo, motion design et portfolio";
const description =
  "Portfolio de Patrick Roziel : montage vidéo, motion design et contenus digitaux. Expériences, compétences et showreel. La Courneuve (93).";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${NOTES_ORIGIN}/work` },
  openGraph: {
    type: "profile",
    url: `${NOTES_ORIGIN}/work`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function WorkLayout({ children }: { children: ReactNode }) {
  return children;
}

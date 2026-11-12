import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Portfolio Monteur Vidéo & Motion Design — Patrick Roziel";
const description =
  "Portfolio professionnel de Patrick Roziel : monteur vidéo, motion designer et créateur de contenus digitaux. Expériences, compétences, showreel. Basé à La Courneuve (93), Île-de-France.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["monteur vidéo", "motion design", "portfolio", "showreel", "montage vidéo", "Patrick Roziel", "La Courneuve"],
  alternates: { canonical: `${NOTES_ORIGIN}/work` },
  openGraph: {
    type: "profile",
    url: `${NOTES_ORIGIN}/work`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function WorkLayout({ children }: { children: ReactNode }) {
  return children;
}

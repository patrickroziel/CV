import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Projets — Patrick Roziel";
const description =
  "Projets de Patrick Roziel : montage, motion design et contenus pour le web et la communication.";

export const metadata: Metadata = {
  title,
  description,
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

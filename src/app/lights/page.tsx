import type { Metadata } from "next";
import { LightsFeed } from "@/components/lights/LightsFeed";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Lights — Fil de médias | Patrick Roziel";
const description = "Citations, images, vidéos et posts. Les médias des articles apparaissent ici, avec un lien vers le texte.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${NOTES_ORIGIN}/lights` },
  openGraph: {
    type: "website",
    url: `${NOTES_ORIGIN}/lights`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
    images: [{ url: "/lights/opengraph-image?v=impact", width: 1200, height: 630, alt: "LIGHTS" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/lights/opengraph-image?v=impact"],
  },
};

export default function LightsPage() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-24 pt-24 sm:pt-28">
      <LightsFeed />
    </main>
  );
}

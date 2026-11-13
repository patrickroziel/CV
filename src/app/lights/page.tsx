import type { Metadata } from "next";
import { LightsFeed } from "@/components/lights/LightsFeed";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Lights — Interventions vidéo | Patrick Roziel";
const description = "Lights rassemble les interventions vidéo de Patrick Roziel, classées dans Notes, Air et Work.";

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
  },
};

export default function LightsPage() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-24 pt-24 sm:pt-28">
      <LightsFeed />
    </main>
  );
}

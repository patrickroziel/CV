import type { Metadata } from "next";
import { NotesFeed } from "@/components/notes/NotesFeed";
import { listPublicPosts, NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Notes — Réflexions et créations | Patrick Roziel";
const description =
  "Notes de Patrick Roziel : livre, réflexions, musiques et fragments de vie. Monteur vidéo et créateur de contenus à La Courneuve.";

const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Patrick Roziel — Notes",
};

export const metadata: Metadata = {
  title,
  description,
  keywords: ["notes", "réflexions", "Patrick Roziel", "musique", "livre", "créations"],
  alternates: { canonical: `${NOTES_ORIGIN}/notes` },
  openGraph: {
    type: "website",
    url: `${NOTES_ORIGIN}/notes`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/twitter-image"],
  },
};

export const revalidate = 300;

export default async function NotesPage() {
  const posts = await listPublicPosts();
  const notes = posts.filter((post) => post.universe !== "air");
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <NotesFeed seedPosts={notes} />
    </main>
  );
}

import type { Metadata } from "next";
import { NotesFeed } from "@/components/notes/NotesFeed";
import { listPublicPosts, NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Patrick Roziel — Monteur vidéo, Notes & Créations";
const description =
  "Patrick Roziel, monteur vidéo et motion designer à La Courneuve (93). Notes, réflexions, musiques et portfolio : montage, motion design et contenus digitaux.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["monteur vidéo", "motion design", "montage vidéo", "Patrick Roziel", "La Courneuve", "portfolio", "contenus digitaux"],
  alternates: { canonical: `${NOTES_ORIGIN}/` },
  openGraph: {
    type: "website",
    url: `${NOTES_ORIGIN}/`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const revalidate = 300;

export default async function Home() {
  const posts = await listPublicPosts();
  const notes = posts.filter((post) => post.universe !== "air");
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <NotesFeed seedPosts={notes} />
    </main>
  );
}

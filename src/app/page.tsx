import type { Metadata } from "next";
import { NotesFeed } from "@/components/notes/NotesFeed";
import { listPublicPosts, NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Patrick Roziel — Notes, réflexions et créations";
const description =
  "Notes de Patrick Roziel : livre, réflexions, musiques et fragments de vie. Monteur vidéo et créateur de contenus à La Courneuve.";

export const metadata: Metadata = {
  title,
  description,
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

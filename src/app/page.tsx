import type { Metadata } from "next";
import { NotesFeed } from "@/components/notes/NotesFeed";
import { NotesIntroduction } from "@/components/notes/NotesIntroduction";

export const metadata: Metadata = {
  title: "Notes — Patrick Roziel",
  description: "Textes, réflexions, images, musiques et fragments de vie de Patrick Roziel.",
};

export default function Home() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <NotesIntroduction />
      <NotesFeed />
    </main>
  );
}

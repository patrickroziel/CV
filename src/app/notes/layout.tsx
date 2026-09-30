import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes — Patrick Roziel",
  description: "Livre, réflexions, documents, images et vidéos de Patrick Roziel.",
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

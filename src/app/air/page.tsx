import type { Metadata } from "next";
import { AirFeed } from "@/components/air/AirFeed";
import { listPublicPosts, NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Air — Décryptages et observations | Patrick Roziel";
const description =
  "Air, le journal de Patrick Roziel : décryptages, expériences et observations sur la communication, les institutions et ce qui semble aller de soi.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${NOTES_ORIGIN}/air` },
  openGraph: {
    type: "website",
    url: `${NOTES_ORIGIN}/air`,
    title,
    description,
    locale: "fr_FR",
    siteName: "Patrick Roziel",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const revalidate = 300;

export default async function AirPage() {
  const posts = await listPublicPosts();
  const air = posts.filter((post) => post.universe === "air");
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <AirFeed seedPosts={air} />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GhostPageView } from "@/components/ghost/GhostPageView";
import { isGhostSlug } from "@/lib/ghost-pages";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";
import { getPublicGhost, ghostShareText } from "@/lib/server/ghost-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GhostParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: GhostParams): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicGhost(slug);
  if (!page) {
    return {
      title: "Page indisponible — Patrick Roziel",
      description: "Cette page n'est pas disponible.",
      robots: { index: false, follow: false },
    };
  }
  const { title, description } = ghostShareText(page);
  const url = `${NOTES_ORIGIN}/g/${page.slug}`;
  return {
    title: `${title} — Patrick Roziel`,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "Patrick Roziel",
      url,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GhostRoute({ params }: GhostParams) {
  const { slug } = await params;
  if (!isGhostSlug(slug)) notFound();
  return <GhostPageView slug={slug} />;
}

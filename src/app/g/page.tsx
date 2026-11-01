import type { Metadata } from "next";
import { GhostPagesIndex } from "@/components/ghost/GhostPagesIndex";

export const metadata: Metadata = {
  title: "Pages fantômes — Patrick Roziel",
  robots: { index: false, follow: false },
};

export default function GhostIndexPage() {
  return <GhostPagesIndex />;
}

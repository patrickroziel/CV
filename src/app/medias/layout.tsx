import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Médias — Patrick Roziel",
  description:
    "Fil médias de Patrick Roziel : notes, documents téléchargeables et vidéos.",
};

export default function MediasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

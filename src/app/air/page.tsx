import type { Metadata } from "next";
import { AirFeed } from "@/components/air/AirFeed";

export const metadata: Metadata = {
  title: "Air — Décryptages, expériences, observations | Patrick Roziel",
  description: "Air, un espace d'information, de décryptage et d'observation par Patrick Roziel.",
};

export default function AirPage() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <AirFeed />
    </main>
  );
}

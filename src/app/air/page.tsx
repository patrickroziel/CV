import type { Metadata } from "next";
import { AirFeed } from "@/components/air/AirFeed";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Air — Décryptages, expériences, observations | Patrick Roziel",
  description: "Air, un espace d'information, de décryptage et d'observation par Patrick Roziel.",
};

export default function AirPage() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-24 pt-24 sm:pt-28">
      <section className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        <div className="max-w-3xl rounded-2xl border border-white/20 bg-[#051a29]/70 px-5 py-6 shadow-lg backdrop-blur-2xl sm:px-8 sm:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[.32em] text-sky-200">Patrick Roziel / Air</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Air<span className="text-sky-300">.</span></h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[.19em] text-sky-100/85 sm:text-sm">Décryptages · Expériences · Observations</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            Regarder les choses en face. Les comprendre. Les formuler.
            Un espace de réflexion et de transmission autour de la communication,
            des institutions et des expériences qui poussent à questionner ce qui semble aller de soi.
          </p>
          <a href="#articles-air" className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-sky-100 underline-offset-4 hover:underline">
            Parcourir les articles <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
      <div id="articles-air"><AirFeed /></div>
    </main>
  );
}

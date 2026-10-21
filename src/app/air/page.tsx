import type { Metadata } from "next";
import { AirFeed } from "@/components/air/AirFeed";
import { Cloud, Compass, BookOpenText } from "lucide-react";

export const metadata: Metadata = {
  title: "Air — Décryptages, expériences, observations | Patrick Roziel",
  description: "Air, un espace d'information, de décryptage et d'observation par Patrick Roziel.",
};
export default function AirPage() {
  return <main className="no-print relative z-10 min-h-screen overflow-hidden pb-24 pt-24 sm:pt-28">
    <section className="relative mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
      <div className="relative isolate min-h-[480px] overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-b from-[#2d87c5] via-[#70c5ea] to-[#c2ecf8] shadow-[0_35px_110px_-28px_rgba(10,50,90,.55)]">
        <div className="air-cloud air-cloud-one" aria-hidden="true" />
        <div className="air-cloud air-cloud-two" aria-hidden="true" />
        <div className="air-cloud air-cloud-three" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#225477]/20 via-transparent to-white/15" />
        <div className="relative flex min-h-[480px] flex-col justify-between gap-20 p-7 sm:p-12 lg:p-16">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.3em] text-[#173e60]/80"><Cloud className="h-4 w-4" /> Un nouvel horizon</div>
          <div>
            <h1 className="text-7xl font-light tracking-[-.08em] text-[#083553] drop-shadow-[0_1px_16px_rgba(255,255,255,.6)] sm:text-9xl">Air<span className="text-white">.</span></h1>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[.24em] text-[#164360] sm:text-sm">Décryptages · Expériences · Observations</p>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#123f58] sm:text-lg">Prendre de la hauteur pour rendre les choses plus claires. Un espace d’informations, de récits d’expérience et d’analyses, notamment autour de l’administration et de la communication.</p>
          </div>
        </div>
      </div>
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        {([
          { icon: Compass, title: "Décryptages", copy: "Mettre en perspective des démarches, des systèmes et des situations complexes." },
          { icon: BookOpenText, title: "Expériences", copy: "Partager ce que j’ai appris au contact des institutions, du travail et du quotidien." },
          { icon: Cloud, title: "Observations", copy: "Explorer les mécanismes de la communication et ce qu’ils révèlent." },
        ]).map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-white/15 bg-[#08202c]/65 p-6 text-zinc-100 backdrop-blur-2xl">
          <Icon className="h-5 w-5 text-cyan-100" />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{copy}</p>
        </div>)}
      </div>
    </section>
    <AirFeed />
  </main>;
}

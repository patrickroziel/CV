import type { Metadata } from "next";
import Link from "next/link";
import { NOTES_ORIGIN } from "@/lib/server/notes-sharing";

const title = "Plan du site — Patrick Roziel";
const description =
  "Plan du site de Patrick Roziel : Air, Notes, Work, Projets et pages principales.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${NOTES_ORIGIN}/plan-du-site` },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "Principales sections",
    links: [
      { href: "/notes", label: "Notes — Réflexions et créations (page d’accueil)" },
      { href: "/air", label: "Air — Décryptages et observations" },
      { href: "/work", label: "Work — Portfolio monteur vidéo" },
      { href: "/projets", label: "Projets — Galerie de réalisations" },
    ],
  },
  {
    title: "Autres",
    links: [
      { href: "/sitemap.xml", label: "Sitemap XML" },
    ],
  },
];

export default function PlanDuSitePage() {
  return (
    <main className="no-print relative z-10 min-h-screen pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Plan du site
        </h1>
        <p className="mt-3 text-zinc-400">
          Navigation principale du site de Patrick Roziel, monteur vidéo et motion designer à La Courneuve.
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-4 text-lg font-semibold text-teal-300">{section.title}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-zinc-200 transition hover:text-teal-300 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

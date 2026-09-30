"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { RichHtml } from "@/components/shared/RichHtml";
import { stripHtml } from "@/lib/sanitize-html";
import { formatPeriod } from "@/lib/utils";

/**
 * Print-only CV layout. Hidden on screen, shown when printing.
 */
export function CvPrintView() {
  const { data, l } = usePortfolio();
  const { profile, experiences, skills, education, languages } = data;

  return (
    <div id="cv-print" className="print-only hidden">
      <header className="mb-6 border-b-2 border-zinc-900 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {stripHtml(profile.name) || profile.name}
        </h1>
        <p className="mt-1 text-lg font-medium text-zinc-700">
          {l(profile.title)}
        </p>
        <p className="mt-2 text-sm text-zinc-600">{l(profile.location)}</p>
        <p className="mt-1 text-sm text-zinc-600">
          {profile.email}
        </p>
        {profile.showreelUrl && (
          <p className="mt-1 text-sm text-zinc-600">
            Showreel : {profile.showreelUrl}
          </p>
        )}
        {l(profile.bio) && (
          <RichHtml
            html={l(profile.bio)}
            plain
            className="mt-3 text-sm leading-relaxed text-zinc-700"
          />
        )}
      </header>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wider text-zinc-900">
          Expériences
        </h2>
        <ul className="space-y-3">
          {experiences.map((exp) => (
            <li key={exp.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-zinc-900">
                  {l(exp.role)} — {l(exp.company)}
                </p>
                <p className="text-xs text-zinc-600">
                  {formatPeriod(exp.startDate, exp.endDate)}
                </p>
              </div>
              {exp.location && l(exp.location) && (
                <p className="text-xs text-zinc-500">{l(exp.location)}</p>
              )}
              {l(exp.description) && (
                <RichHtml
                  html={l(exp.description)}
                  plain
                  className="mt-1 text-sm text-zinc-700"
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wider text-zinc-900">
          Compétences
        </h2>
        <p className="text-sm text-zinc-700">
          {skills.map((s) => l(s.name)).join(" · ")}
        </p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wider text-zinc-900">
          Formation
        </h2>
        <ul className="space-y-2">
          {education.map((edu) => (
            <li key={edu.id} className="text-sm text-zinc-700">
              <span className="font-semibold">{edu.year}</span> — {l(edu.degree)},{" "}
              {l(edu.school)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wider text-zinc-900">
          Langues
        </h2>
        <p className="text-sm text-zinc-700">
          {languages.map((lang) => `${l(lang.name)} (${l(lang.level)})`).join(" · ")}
        </p>
      </section>
    </div>
  );
}

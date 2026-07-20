"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { ProjectMedia } from "@/components/projects/ProjectMedia";
import { SkillTag } from "@/components/skills/SkillTag";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isHydrated, l } = usePortfolio();

  const index = useMemo(
    () => data.projects.findIndex((p) => p.id === id),
    [data.projects, id]
  );
  const project = index >= 0 ? data.projects[index] : null;
  const prev = index > 0 ? data.projects[index - 1] : null;
  const next =
    index >= 0 && index < data.projects.length - 1
      ? data.projects[index + 1]
      : null;

  if (!isHydrated) {
    return (
      <main className="no-print relative z-10 pb-16 pt-32">
        <div className="mx-auto max-w-4xl px-4">
          <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="no-print relative z-10 pb-16 pt-32">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <GlassCard className="p-12">
            <p className="text-zinc-300">Projet introuvable.</p>
            <Button asChild className="mt-6">
              <Link href="/projets">Retour à la galerie</Link>
            </Button>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main className="no-print relative z-10 pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link
          href="/projets"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Galerie
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="overflow-hidden">
            <div
              className={
                project.mediaType === "x"
                  ? "relative min-h-[360px] w-full overflow-hidden bg-black sm:min-h-[420px] sm:aspect-video"
                  : "relative aspect-video w-full overflow-hidden bg-black"
              }
            >
              <ProjectMedia project={project} interactive />
              {project.mediaType === "image" && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              )}
            </div>
            <div className="p-6 sm:p-10">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
                {l(project.title)}
              </h1>
              <p className="mt-3 text-lg text-zinc-400">{l(project.description)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((t) => (
                  <SkillTag key={t} label={t} variant="default" />
                ))}
              </div>
              {project.longDescription && l(project.longDescription) && (
                <p className="mt-6 text-base leading-relaxed text-zinc-300">
                  {l(project.longDescription)}
                </p>
              )}
              {project.link && (
                <Button asChild className="mt-8" size="lg">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir le projet
                  </a>
                </Button>
              )}
            </div>
          </GlassCard>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {prev ? (
            <Button variant="secondary" asChild>
              <Link href={`/projets/${prev.id}`}>
                <ArrowLeft className="h-4 w-4" />
                {l(prev.title)}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button variant="secondary" asChild>
              <Link href={`/projets/${next.id}`}>
                {l(next.title)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

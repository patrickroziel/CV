"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass/GlassCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProjetsPage() {
  const { data, addProject, updateProject } = usePortfolio();
  const [tag, setTag] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    data.projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [data.projects]);

  const filtered = useMemo(() => {
    if (!tag) return data.projects;
    return data.projects.filter((p) => p.tags.includes(tag));
  }, [data.projects, tag]);

  return (
    <main className="no-print relative z-10 pb-16 pt-28 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Link
          href="/#projects"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-teal-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au portfolio
        </Link>

        <SectionHeading
          eyebrow="Galerie"
          title="Tous les projets"
          description="Filtrez par tag et explorez le détail de chaque réalisation."
          action={
            <EditGate>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </EditGate>
          }
        />

        <GlassCard className="mb-8 flex flex-wrap gap-2 p-4">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              !tag
                ? "bg-teal-300 text-zinc-950"
                : "bg-white/10 text-zinc-300 hover:bg-white/15"
            )}
          >
            Tout
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t === tag ? null : t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                tag === t
                  ? "bg-teal-300 text-zinc-950"
                  : "bg-white/10 text-zinc-300 hover:bg-white/15"
              )}
            >
              {t}
            </button>
          ))}
        </GlassCard>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-zinc-400">
            Aucun projet pour ce filtre.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onEdit={setEditing}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={(values: ProjectFormValues) => {
              addProject(values);
              setCreateOpen(false);
            }}
            onCancel={() => setCreateOpen(false)}
            submitLabel="Ajouter"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProjectForm
              initial={editing}
              onSubmit={(values) => {
                updateProject(editing.id, values);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

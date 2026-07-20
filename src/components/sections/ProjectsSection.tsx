"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { EditGate } from "@/components/shared/EditGate";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
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
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { Project } from "@/lib/types";

export function ProjectsSection() {
  const { data, addProject, updateProject, t } = usePortfolio();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const preview = data.projects.slice(0, 3);

  return (
    <section id="projects" className="relative z-10 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t("sections.projectsEyebrow")}
          title={t("sections.projectsTitle")}
          description={t("sections.projectsDesc")}
          action={
            <div className="flex flex-wrap gap-2">
              <EditGate>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {t("actions.add")}
                </Button>
              </EditGate>
              <Button variant="secondary" asChild>
                <Link href="/projets">
                  {t("actions.seeAll")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          }
        />

        {preview.length === 0 ? (
          <p className="py-12 text-center text-zinc-400">Aucun projet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((project, i) => (
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
    </section>
  );
}

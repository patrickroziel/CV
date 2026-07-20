"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/skills/SkillTag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { ProjectMedia } from "@/components/projects/ProjectMedia";

type ProjectCardProps = {
  project: Project;
  index?: number;
  onEdit?: (p: Project) => void;
};

function mediaBadge(project: Project): { label: string; show: boolean } {
  if (project.mediaType === "youtube") return { label: "YouTube", show: true };
  if (project.mediaType === "x") return { label: "X", show: true };
  return { label: "", show: false };
}

export function ProjectCard({ project, index = 0, onEdit }: ProjectCardProps) {
  const { editMode, removeProject, l } = usePortfolio();
  const badge = mediaBadge(project);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <GlassCard
        glow
        className="group relative flex h-full flex-col overflow-hidden"
      >
        <Link href={`/projets/${project.id}`} className="block">
          <div className="relative aspect-video overflow-hidden">
            <ProjectMedia project={project} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            {badge.show && (
              <span className="glass-chip pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-teal-100">
                {project.mediaType === "x" ? (
                  <span className="text-[11px] leading-none">𝕏</span>
                ) : (
                  <Video className="h-3 w-3" />
                )}
                {badge.label}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-lg font-semibold text-zinc-50 group-hover:text-teal-200">
              {l(project.title)}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
              {l(project.description)}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 4).map((tag) => (
                <SkillTag
                  key={tag}
                  label={tag}
                  variant="secondary"
                  stopPropagation
                />
              ))}
            </div>
          </div>
        </Link>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 z-[1] flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-zinc-300 opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:text-teal-200"
            onClick={(e) => e.stopPropagation()}
            aria-label="Lien externe"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        {editMode && (
          <div className="absolute right-2 top-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 opacity-90"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Pencil />
                    Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300"
                  onClick={() => {
                    if (confirm("Supprimer ce projet ?")) {
                      removeProject(project.id);
                    }
                  }}
                >
                  <Trash2 />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

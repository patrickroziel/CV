"use client";

import { useMemo, useState } from "react";
import { AirTagTicker } from "@/components/air/AirTagTicker";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { getL } from "@/lib/i18n-content";

function addTag(set: Map<string, string>, raw: string | null | undefined) {
  const tag = (raw || "").replace(/\s+/g, " ").trim();
  if (!tag) return;
  const key = tag.toLocaleLowerCase("fr");
  if (!set.has(key)) set.set(key, tag);
}

export function WorkTagTicker() {
  const { data, locale } = usePortfolio();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Map<string, string>();
    for (const project of data.projects ?? []) {
      for (const tag of project.tags ?? []) addTag(set, tag);
    }
    for (const skill of data.skills ?? []) {
      addTag(set, getL(skill.category, locale) || getL(skill.name, locale));
    }
    return [...set.values()];
  }, [data.projects, data.skills, locale]);

  const reveal = (tag: string) => {
    const key = tag.toLocaleLowerCase("fr");
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-work-tags]"));
    const match = cards.find((card) => (card.dataset.workTags || "").split("|").includes(key));
    const target = match ?? document.getElementById("skills") ?? document.getElementById("projects");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <AirTagTicker
      tags={tags}
      activeTag={activeTag}
      onClear={() => setActiveTag(null)}
      onToggle={(tag) => {
        setActiveTag((current) => {
          const next = current?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr") ? null : tag;
          if (next) reveal(next);
          return next;
        });
      }}
    />
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Briefcase, Clapperboard, GraduationCap, Languages, LayoutGrid, Mail, Quote, Sparkles } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { DEFAULT_NAV, type NavItemId } from "@/lib/types";

const ITEMS: { id: NavItemId; target: string; icon: typeof Mail }[] = [
  { id: "home", target: "showreel", icon: Clapperboard },
  { id: "experience", target: "experience", icon: Briefcase },
  { id: "projects", target: "projects", icon: LayoutGrid },
  { id: "skills", target: "skills", icon: Sparkles },
  { id: "education", target: "education", icon: GraduationCap },
  { id: "languages", target: "languages", icon: Languages },
  { id: "quotes", target: "devis", icon: Quote },
  { id: "contact", target: "contact", icon: Mail },
];

export function WorkCategoryDock() {
  const { data, editMode, l, t } = usePortfolio();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [current, setCurrent] = useState("showreel");
  const visible = useMemo(
    () => ITEMS.filter((item) => editMode || (data.nav ?? DEFAULT_NAV)[item.id]?.visible !== false),
    [data.nav, editMode],
  );
  const key = visible.map((item) => item.target).join("|");

  useEffect(() => {
    setSlot(document.getElementById("bottom-nav-slot"));
  }, []);

  useEffect(() => {
    const nodes = key
      .split("|")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node instanceof HTMLElement);
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      const hit = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (hit?.target.id) setCurrent(hit.target.id);
    }, { rootMargin: "-28% 0px -50% 0px", threshold: [0.12, 0.35, 0.6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [key]);

  if (!slot || !visible.length) return null;

  return createPortal(
    <nav className="air-float-bar work-category-dock" aria-label="Catégories Work">
      {visible.map((item) => {
        const Icon = item.icon;
        const label = l((data.nav ?? DEFAULT_NAV)[item.id]?.label).trim() || t(`nav.${item.id}`);
        const active = current === item.target;
        return (
          <a
            key={item.id}
            href={`#${item.target}`}
            className={`dock-icon${active ? " is-on" : ""}`}
            aria-label={label}
            title={label}
            aria-current={active ? "true" : undefined}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
              setCurrent(item.target);
            }}
          >
            <Icon aria-hidden />
          </a>
        );
      })}
    </nav>,
    slot,
  );
}

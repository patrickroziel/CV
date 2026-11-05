"use client";

import { useEffect, useState } from "react";

type Part = { id: string; label: string };

export function ArticlePartNav({ targetId }: { targetId: string }) {
  const [parts, setParts] = useState<Part[]>([]);

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2.air-part-title"));
    heads.forEach((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
    });
    if (!heads.length) return;

    const pick = () => {
      const title = root.closest("article")?.querySelector(".air-title-pill");
      const line = title ? title.getBoundingClientRect().bottom : 160;
      const stuck = heads.filter((el) => el.getBoundingClientRect().top < line - 8);
      heads.forEach((el) => el.classList.toggle("air-part-held", stuck.includes(el)));
      setParts(stuck.map((el) => ({
        id: el.id,
        label: (el.textContent || "").replace(/\s+/g, " ").trim(),
      })));
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [targetId]);

  if (!parts.length) return null;

  return (
    <div className="air-part-stack">
      {parts.map((part) => (
        <a
          key={part.id}
          href={`#${part.id}`}
          className="air-part-float"
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(part.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {part.label}
        </a>
      ))}
    </div>
  );
}

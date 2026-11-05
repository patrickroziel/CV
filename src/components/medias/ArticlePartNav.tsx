"use client";

import { useEffect, useState } from "react";

export function ArticlePartNav({ targetId }: { targetId: string }) {
  const [parts, setParts] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll("h2.air-part-title"));
    const items = heads.map((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
      return { id: el.id, label: (el.textContent || "").replace(/\s+/g, " ").trim() || `Partie ${index + 1}` };
    });
    setParts(items);
    if (!heads.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible?.target.id) setActive(visible.target.id);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.6] });
    heads.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [targetId]);

  if (!parts.length) return null;

  return (
    <nav className="article-part-nav mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Parties de l’article">
      {parts.map((part) => (
        <a
          key={part.id}
          href={`#${part.id}`}
          aria-current={part.id === active ? "true" : undefined}
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(part.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {part.label}
        </a>
      ))}
    </nav>
  );
}

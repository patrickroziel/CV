"use client";

import { useEffect, useState } from "react";

export function ArticlePartNav({ targetId }: { targetId: string }) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const heads = Array.from(root.querySelectorAll<HTMLElement>("h2.air-part-title"));
    heads.forEach((el, index) => {
      if (!el.id) el.id = `part-${index}-${targetId}`;
    });
    if (!heads.length) return;

    const pick = () => {
      const line = 150;
      let current: HTMLElement | null = null;
      for (const head of heads) {
        if (head.getBoundingClientRect().top <= line) current = head;
      }
      if (!current || current.getBoundingClientRect().bottom > line - 8) {
        setLabel("");
        setHref("");
        return;
      }
      setLabel((current.textContent || "").replace(/\s+/g, " ").trim());
      setHref(`#${current.id}`);
    };

    pick();
    window.addEventListener("scroll", pick, { passive: true });
    return () => window.removeEventListener("scroll", pick);
  }, [targetId]);

  if (!label) return null;

  return (
    <a
      href={href}
      className="air-part-float"
      onClick={(event) => {
        event.preventDefault();
        const id = href.slice(1);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {label}
    </a>
  );
}

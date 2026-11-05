"use client";

import { useEffect } from "react";

function isBlocked(value: string | null | undefined) {
  if (!value) return false;
  return value.includes("blob.vercel-storage.com") || value.includes("/api/media/blob");
}

function mediaAddress(node: Element) {
  const own = node.getAttribute("src") || node.getAttribute("poster") || "";
  if (isBlocked(own)) return own;
  const nested = node.querySelector("source")?.getAttribute("src") || "";
  return nested;
}

function paint(node: Element) {
  if (!(node instanceof HTMLElement)) return;
  if (node.dataset.wip === "1" || node.classList.contains("blob-wip")) return;
  const src = mediaAddress(node);
  const background = node.style.backgroundImage || "";
  if (!isBlocked(src) && !isBlocked(background)) return;

  const frame = document.createElement("div");
  frame.className = "blob-wip";
  frame.dataset.wip = "1";
  frame.setAttribute("role", "img");
  frame.setAttribute("aria-label", "Work in progress");
  frame.innerHTML =
    '<span class="blob-wip__mark" aria-hidden="true"><svg viewBox="0 0 48 48" class="blob-wip__gem"><path d="M24 6 38 16.5 24 42 10 16.5 24 6Z"/><path d="M10 16.5h28M24 6 18 16.5 24 42 30 16.5 24 6Z"/></svg></span><span class="blob-wip__kicker">Work in progress</span>';

  const positioned = getComputedStyle(node).position === "absolute";
  if (positioned) frame.classList.add("blob-wip--fill");
  node.replaceWith(frame);
}

function scan(root: ParentNode) {
  root.querySelectorAll("img, video, source").forEach((node) => {
    const src = node.getAttribute("src") || node.getAttribute("poster") || "";
    if (!isBlocked(src)) return;
    const host = node instanceof HTMLSourceElement ? node.parentElement : node;
    if (host) paint(host);
  });
}

export function BlobMediaGuard() {
  useEffect(() => {
    scan(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("img, video, source")) paint(node instanceof HTMLSourceElement ? node.parentElement ?? node : node);
          scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}

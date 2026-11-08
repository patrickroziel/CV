"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  DEFAULT_LINE_HEIGHT,
  extractRichSpacing,
  formatLineHeight,
} from "@/lib/rich-spacing";
import {
  looksLikeHtml,
  sanitizeBioHtml,
  stripHtml,
} from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";
import { shrinkHostedImages } from "@/lib/display-image";
import { ghostSlugFromHref } from "@/lib/ghost-href";
import { useOptionalPortfolio } from "@/components/providers/PortfolioProvider";

type RichHtmlProps = {
  html: string;
  className?: string;
  as?: "p" | "div" | "span" | "h1" | "h2" | "h3";
  plain?: boolean;
  lockLineHeight?: number;
};

/**
 * Public rich-text renderer. Colours / bold / italic / lists match the editor.
 * Base text colour comes from className; inline span[style|data-rich-color] win.
 */
export function RichHtml({
  html,
  className,
  as: Tag = "div",
  plain = false,
  lockLineHeight,
}: RichHtmlProps) {
  const isHtml = useMemo(() => looksLikeHtml(html), [html]);
  const { lineHeight, body } = useMemo(
    () =>
      isHtml
        ? extractRichSpacing(html)
        : { lineHeight: DEFAULT_LINE_HEIGHT, body: html },
    [html, isHtml]
  );
  const safe = useMemo(
    () => (isHtml ? shrinkHostedImages(sanitizeBioHtml(body)) : body),
    [body, isHtml]
  );
  const rootRef = useRef<HTMLElement>(null);
  const portfolio = useOptionalPortfolio();
  const portfolioRef = useRef(portfolio);
  portfolioRef.current = portfolio;
  const ghostKey = (portfolio?.data.ghostPages ?? [])
    .map((page) => `${page.slug}:${page.updatedAt}:${page.visible ? 1 : 0}`)
    .join("|");
  const locale = portfolio?.locale;
  const editMode = portfolio?.editMode;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const current = portfolioRef.current;
    if (!root || !current) return;
    const pages = current.data.ghostPages ?? [];
    root.querySelectorAll<HTMLElement>("blockquote.ghost-link-card").forEach((card) => {
      if (card.closest(".ghost-inline-scroll")) return;
      card.querySelector(":scope > .ghost-inline-read")?.remove();
      const href = card.querySelector("a")?.getAttribute("href") || "";
      const slug = ghostSlugFromHref(href);
      const page = slug ? pages.find((item) => item.slug === slug) : undefined;
      if (!page || (page.visible === false && !current.editMode)) return;
      const text = current.l(page.body);
      if (!stripHtml(text).trim()) return;
      const panel = document.createElement("div");
      panel.className = "ghost-inline-read";
      const scroller = document.createElement("div");
      scroller.className = "ghost-inline-scroll rich-html";
      scroller.innerHTML = sanitizeBioHtml(text);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost-inline-more";
      button.textContent = "Lire plus";
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const open = panel.classList.toggle("is-open");
        button.textContent = open ? "Réduire" : "Lire plus";
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });
      panel.append(scroller, button);
      card.appendChild(panel);
      if (scroller.scrollHeight <= 132) {
        scroller.classList.add("is-short");
        button.remove();
      }
    });
  }, [safe, ghostKey, locale, editMode]);

  if (!html) return null;

  const lhStyle = { lineHeight: formatLineHeight(lockLineHeight ?? lineHeight) };

  if (plain || !isHtml) {
    return (
      <Tag
        className={cn("whitespace-pre-line rich-lh", className)}
        style={lhStyle}
      >
        {plain && isHtml ? stripHtml(html) : html}
      </Tag>
    );
  }

  return (
    <Tag
      ref={rootRef as never}
      className={cn(
        "rich-html rich-lh whitespace-pre-line",
        "[&_*]:[font-family:inherit]",
        "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic",
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_p]:m-0 [&_p+p]:mt-1.5",
        "[&_li]:my-0",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-[3px] [&_blockquote]:border-current/50 [&_blockquote]:pl-4 [&_blockquote]:italic",
        className
      )}
      style={lhStyle}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

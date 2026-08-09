"use client";

import { useMemo } from "react";
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

type RichHtmlProps = {
  html: string;
  className?: string;
  as?: "p" | "div" | "span" | "h1" | "h2" | "h3";
  plain?: boolean;
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
    () => (isHtml ? sanitizeBioHtml(body) : body),
    [body, isHtml]
  );

  if (!html) return null;

  const lhStyle = { lineHeight: formatLineHeight(lineHeight) };

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
      className={cn(
        "rich-html rich-lh whitespace-pre-line",
        "[&_*]:[font-family:inherit]",
        "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic",
        "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_p]:m-0 [&_p+p]:mt-1.5",
        "[&_li]:my-0",
        className
      )}
      style={lhStyle}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

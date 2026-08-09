"use client";

import {
  Briefcase,
  FileText,
  IdCard,
  type LucideIcon,
} from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/motion/MagneticButton";
import {
  EXTRA_DOCUMENT_IDS,
  type ExtraDocumentId,
} from "@/lib/types";

const DOC_ICONS: Record<ExtraDocumentId, LucideIcon> = {
  personalCv: FileText,
  portfolioPdf: Briefcase,
  businessCard: IdCard,
};

type ExtraDocumentButtonsProps = {
  /** Where the buttons are rendered */
  placement: "hero" | "contact";
  /** Button size / variant for visual consistency */
  size?: "default" | "lg" | "sm";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
};

/**
 * Renders the three optional extra-document buttons (CV PDF, portfolio PDF,
 * interactive business card) for Hero or Contact according to contact.extraDocuments.
 */
export function ExtraDocumentButtons({
  placement,
  size = "lg",
  variant = "outline",
  className,
}: ExtraDocumentButtonsProps) {
  const { data, l } = usePortfolio();
  const docs = data.contact.extraDocuments;

  const visible = EXTRA_DOCUMENT_IDS.filter((id) => {
    const d = docs?.[id];
    if (!d?.show || !d.url?.trim()) return false;
    return placement === "hero" ? d.showInHero : d.showInContact;
  });

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((id) => {
        const d = docs[id];
        const Icon = DOC_ICONS[id];
        const href = d.url!.trim();
        return (
          <MagneticButton key={id} className={className}>
            <Button size={size} variant={variant} asChild>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <Icon className="h-4 w-4" />
                {l(d.label) || id}
              </a>
            </Button>
          </MagneticButton>
        );
      })}
    </>
  );
}

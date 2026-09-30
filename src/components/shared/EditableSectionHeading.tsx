"use client";

import { SectionHeading } from "@/components/shared/SectionHeading";
import { EditGate } from "@/components/shared/EditGate";
import { LocalizedField } from "@/components/i18n/LocalizedField";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { MaybeLocalized } from "@/lib/i18n-content";
import { liftToLocalized } from "@/lib/i18n-content";

type EditableSectionHeadingProps = {
  /** Small uppercase label above the title */
  eyebrow: MaybeLocalized;
  onEyebrowChange: (next: ReturnType<typeof liftToLocalized>) => void;
  title: string;
  /** Optional localized title (edit mode) */
  titleValue?: MaybeLocalized;
  onTitleChange?: (next: ReturnType<typeof liftToLocalized>) => void;
  /** Optional description under the title */
  description?: MaybeLocalized;
  onDescriptionChange?: (next: ReturnType<typeof liftToLocalized>) => void;
  descriptionFallback?: string;
  action?: React.ReactNode;
  className?: string;
  eyebrowClassName?: string;
};

/**
 * Section heading with Mode Édition fields for eyebrow (+ optional description).
 */
export function EditableSectionHeading({
  eyebrow,
  onEyebrowChange,
  title,
  titleValue,
  onTitleChange,
  description,
  onDescriptionChange,
  descriptionFallback,
  action,
  className,
  eyebrowClassName,
}: EditableSectionHeadingProps) {
  const { l } = usePortfolio();

  const eyebrowText = l(eyebrow);
  const descriptionText =
    description != null
      ? l(description) || descriptionFallback || undefined
      : descriptionFallback;

  return (
    <>
      <SectionHeading
        className={className}
        eyebrowClassName={eyebrowClassName}
        eyebrow={eyebrowText || undefined}
        title={
          titleValue != null ? l(titleValue).trim() || title : title
        }
        description={descriptionText}
        action={action}
      />
      <EditGate>
        <div className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <LocalizedField
            label="Petit titre (eyebrow)"
            value={eyebrow}
            onChange={onEyebrowChange}
            placeholder="Ex. International, Expertise…"
          />
          {onTitleChange && (
            <LocalizedField
              label="Titre"
              value={titleValue ?? title}
              onChange={onTitleChange}
              placeholder={title}
            />
          )}
          {onDescriptionChange && (
            <LocalizedField
              label="Description sous le titre"
              value={description ?? {}}
              onChange={onDescriptionChange}
              multiline
              rows={2}
              placeholder={descriptionFallback}
            />
          )}
        </div>
      </EditGate>
    </>
  );
}

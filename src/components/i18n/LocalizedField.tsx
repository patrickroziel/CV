"use client";

import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { LOCALES, LOCALE_META } from "@/i18n/locales";
import {
  isLocaleFilled,
  setL,
  type MaybeLocalized,
} from "@/lib/i18n-content";
import { cn } from "@/lib/utils";

type LocalizedFieldProps = {
  label: string;
  value: MaybeLocalized;
  onChange: (next: ReturnType<typeof setL>) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  id?: string;
  className?: string;
  /**
   * Force plain single-line input even if multiline (rare).
   * Multiline fields always use rich editor + smart paste.
   */
  plain?: boolean;
};

/**
 * Form field bound to one locale of a LocalizedString.
 * - Single-line: input with emoji-safe paste
 * - Multiline: rich editor (lists, bold/italic, structure-preserving paste)
 */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  placeholder,
  id,
  className,
  plain = false,
}: LocalizedFieldProps) {
  const { editingLocale, le, t } = usePortfolio();
  const fieldId = id || `loc-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const current = le(value);

  if (multiline && !plain) {
    return (
      <RichLocalizedField
        label={label}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        id={fieldId}
        className={className}
      />
    );
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={fieldId}>{label}</Label>
        <div className="flex gap-0.5">
          {LOCALES.map((code) => {
            const filled = isLocaleFilled(value, code);
            const active = code === editingLocale;
            return (
              <span
                key={code}
                title={filled ? t("edit.filled") : t("edit.missing")}
                className={cn(
                  "rounded px-1 text-[9px] font-bold uppercase",
                  active && "ring-1 ring-amber-300/50",
                  filled
                    ? "bg-teal-300/20 text-teal-200"
                    : "bg-white/5 text-zinc-600"
                )}
              >
                {LOCALE_META[code].short}
              </span>
            );
          })}
        </div>
      </div>
      <Input
        id={fieldId}
        value={current}
        placeholder={placeholder || t("edit.fallbackHint")}
        onChange={(e) =>
          onChange(setL(value, editingLocale, e.target.value))
        }
      />
    </div>
  );
}

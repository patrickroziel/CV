"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { getL, setL, type MaybeLocalized } from "@/lib/i18n-content";
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
  plain?: boolean;
};

/** Éditeur volontairement mono-langue : le site est maintenant édité en français uniquement. */
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
  const fieldId = id || `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const current = getL(value, "fr");

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
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        value={current}
        placeholder={placeholder}
        onChange={(e) => onChange(setL(value, "fr", e.target.value))}
      />
    </div>
  );
}

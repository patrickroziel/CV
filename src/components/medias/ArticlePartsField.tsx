"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RichLocalizedField } from "@/components/i18n/RichLocalizedField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinArticleParts, splitArticleParts, type ArticlePartDraft } from "@/lib/article-parts";
import { getL, setL, type MaybeLocalized } from "@/lib/i18n-content";

type ArticlePartsFieldProps = {
  label: string;
  value: MaybeLocalized;
  onChange: (next: ReturnType<typeof setL>) => void;
  rows?: number;
  placeholder?: string;
  insertBlockToken?: { nonce: string; token: string };
};

type DraftPart = ArticlePartDraft & { key: string };

function withKeys(parts: ArticlePartDraft[]): DraftPart[] {
  return parts.map((part) => ({ ...part, key: crypto.randomUUID() }));
}

export function ArticlePartsField({
  label,
  value,
  onChange,
  rows = 8,
  placeholder,
  insertBlockToken,
}: ArticlePartsFieldProps) {
  const [parts, setParts] = useState<DraftPart[]>(() => withKeys(splitArticleParts(getL(value, "fr"))));

  function publish(nextParts: DraftPart[]) {
    const blocks = nextParts.length ? nextParts : [{ key: crypto.randomUUID(), title: "", body: "" }];
    setParts(blocks);
    onChange(setL(value, "fr", joinArticleParts(blocks)));
  }

  return (
    <div className="grid gap-3">
      {parts.map((part, index) => (
        <section key={part.key} className="grid gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100/70">
              {index === 0 ? "Début" : `Partie ${index + 1}`}
            </p>
            {parts.length > 1 && (
              <button
                type="button"
                onClick={() => publish(parts.filter((item) => item.key !== part.key))}
                className="inline-flex items-center gap-1 text-[11px] text-red-200"
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirer
              </button>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`part-title-${part.key}`}>{index === 0 ? "Titre du début" : "Titre de la partie"}</Label>
            <Input
              id={`part-title-${part.key}`}
              value={part.title}
              placeholder={index === 0 ? "Introduction" : "Titre de la partie"}
              onChange={(event) => {
                const title = event.target.value;
                publish(parts.map((item) => item.key === part.key ? { ...item, title } : item));
              }}
            />
          </div>
          <RichLocalizedField
            label={index === 0 ? label : "Texte de la partie"}
            value={part.body}
            onChange={(next) => {
              const body = getL(next, "fr");
              publish(parts.map((item) => item.key === part.key ? { ...item, body } : item));
            }}
            rows={index === 0 ? rows : 7}
            placeholder={index === 0 ? placeholder : "Écris le texte de cette partie…"}
            allowPart={false}
            insertBlockToken={index === 0 ? insertBlockToken : undefined}
          />
        </section>
      ))}
      <button
        type="button"
        onClick={() => publish([...parts, { key: crypto.randomUUID(), title: "", body: "" }])}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-100"
      >
        <Plus className="h-3.5 w-3.5" /> Ajouter une partie
      </button>
    </div>
  );
}

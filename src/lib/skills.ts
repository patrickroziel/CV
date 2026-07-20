import type { Skill } from "@/lib/types";
import { allLocalizedValues, getL } from "@/lib/i18n-content";
import { DEFAULT_LOCALE } from "@/i18n/locales";

/** Normalize a skill / tag label for matching */
export function normalizeSkillLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a skill from a tag label or skill id.
 * Matches any localized name variant (FR/EN/PL/ES).
 */
export function findSkillByLabel(
  skills: Skill[],
  labelOrId: string
): Skill | null {
  const raw = labelOrId.trim();
  if (!raw) return null;

  const byId = skills.find((s) => s.id === raw);
  if (byId) return byId;

  const n = normalizeSkillLabel(raw);
  if (!n) return null;

  const exact = skills.find((s) =>
    allLocalizedValues(s.name).some((v) => normalizeSkillLabel(v) === n)
  );
  if (exact) return exact;

  const contained = skills
    .filter((s) => {
      const variants = allLocalizedValues(s.name).map(normalizeSkillLabel);
      return variants.some((sn) => sn.includes(n) || n.includes(sn));
    })
    .sort((a, b) => {
      const la = getL(a.name, DEFAULT_LOCALE).length;
      const lb = getL(b.name, DEFAULT_LOCALE).length;
      return lb - la;
    });

  return contained[0] ?? null;
}

/** Synthetic skill when a tag has no matching fiche yet */
export function skillPlaceholder(label: string): Skill {
  return {
    id: `placeholder:${normalizeSkillLabel(label)}`,
    name: { fr: label.trim() || "Compétence" },
    description: undefined,
    image: null,
    icons: [],
  };
}

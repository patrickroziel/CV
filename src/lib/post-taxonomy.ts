export const NOTES_CATEGORIES = ["Livre", "Musique", "Essais"] as const;
export const AIR_CATEGORIES = ["Parcours", "Travail", "Droits"] as const;

export type NotesCategory = (typeof NOTES_CATEGORIES)[number];
export type AirCategory = (typeof AIR_CATEGORIES)[number];
export type PostCategory = NotesCategory | AirCategory;

const NOTES_BY_ID: Record<string, NotesCategory> = {
  "4d8afaca-a15f-4dd7-b5b8-61f4dcda3447": "Livre",
  "883f3417-e81c-4909-8754-9a996b94cb43": "Livre",
  "14a78837-87df-4839-89de-de0d1c610fa1": "Musique",
  "6105218c-288c-47ec-8c18-3ab210d002e2": "Musique",
  "584e1f27-ee0a-42fc-8262-d9eba8d831ad": "Musique",
  "74d207ec-f487-4c2d-bf27-cc198597a316": "Essais",
  "48e8d59e-1048-493b-9aca-096ae9330180": "Essais",
};

const AIR_BY_ID: Record<string, AirCategory> = {
  "31bd4a5c-4632-498d-955e-a7163a59911d": "Parcours",
  "7f75260a-23d3-42b7-9a92-59b78e719ea0": "Parcours",
  "81e1284e-5c0f-4e13-bbb8-3424dc04960e": "Travail",
  "3283a9ef-c586-4f98-a45d-5e5d6d7fcdff": "Travail",
  "91195d43-317d-4f57-aeec-5ea1695e7d6f": "Droits",
};

export function postUniverse(universe?: string | null): "notes" | "air" {
  return universe === "air" ? "air" : "notes";
}

/** Keeps a category the author chose. Legacy labels are reassigned from the texts. */
export function coercePostCategory(post: {
  id?: string;
  universe?: string | null;
  category?: string | null;
}): PostCategory {
  const universe = postUniverse(post.universe);
  const allowed: readonly string[] = universe === "air" ? AIR_CATEGORIES : NOTES_CATEGORIES;
  const current = post.category?.trim() ?? "";
  if (allowed.includes(current)) return current as PostCategory;
  const mapped = (universe === "air" ? AIR_BY_ID : NOTES_BY_ID)[post.id ?? ""];
  if (mapped) return mapped;
  return universe === "air" ? "Parcours" : "Essais";
}

export function collectPostTags(posts: Array<{ tags?: string[] | null }>): string[] {
  const seen = new Map<string, string>();
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      const clean = tag.trim();
      const key = clean.toLocaleLowerCase("fr");
      if (clean && !seen.has(key)) seen.set(key, clean);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

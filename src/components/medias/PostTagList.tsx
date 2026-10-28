"use client";

export function PostTagList({
  tags,
  activeTag,
  onToggle,
  onClear,
  tone = "dark",
}: {
  tags: string[];
  activeTag: string | null;
  onToggle: (tag: string) => void;
  onClear: () => void;
  tone?: "dark" | "light";
}) {
  if (!tags.length) return null;
  const light = tone === "light";
  return (
    <div className={light
      ? "mt-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl"
      : "mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"}>
      <div className="flex items-center justify-between gap-2">
        <p className={light
          ? "text-[10px] uppercase tracking-[.24em] text-white/60"
          : "text-[10px] uppercase tracking-[0.24em] text-zinc-500"}>
          Tags
        </p>
        {activeTag ? (
          <button
            type="button"
            onClick={onClear}
            className={light
              ? "text-[10px] text-white/70 underline-offset-2 hover:text-white hover:underline"
              : "text-[10px] text-zinc-500 underline-offset-2 hover:text-zinc-200 hover:underline"}
          >
            Tout voir
          </button>
        ) : null}
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const active = activeTag?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr");
          return (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onToggle(tag)}
                aria-pressed={active}
                className={light
                  ? `rounded-full border px-2.5 py-1 text-left text-[11px] leading-snug transition ${active ? "border-white/70 bg-white text-slate-950" : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20"}`
                  : `rounded-full border px-2.5 py-1 text-left text-[11px] leading-snug transition ${active ? "border-cyan-100/40 bg-cyan-100/15 text-cyan-50" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"}`}
              >
                {tag}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

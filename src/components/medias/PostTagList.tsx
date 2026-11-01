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
      ? "mt-4 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl sm:p-4"
      : "mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl sm:p-4"}>
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
      {/* Compact + horizontal scroll on mobile, wrap on larger screens */}
      <ul className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 sm:mt-3 sm:flex-wrap sm:overflow-visible sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tags.map((tag) => {
          const active = activeTag?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr");
          return (
            <li key={tag} className="shrink-0 sm:shrink">
              <button
                type="button"
                onClick={() => onToggle(tag)}
                aria-pressed={active}
                className={light
                  ? `whitespace-nowrap rounded-full border px-2 py-0.5 text-left text-[10.5px] leading-snug transition sm:px-2.5 sm:py-1 sm:text-[11px] ${active ? "border-white/70 bg-white text-slate-950" : "border-white/20 bg-white/10 text-white/85 hover:bg-white/20"}`
                  : `whitespace-nowrap rounded-full border px-2 py-0.5 text-left text-[10.5px] leading-snug transition sm:px-2.5 sm:py-1 sm:text-[11px] ${active ? "border-cyan-100/40 bg-cyan-100/15 text-cyan-50" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white"}`}
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

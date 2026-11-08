"use client";

export function AirTagTicker({
  tags,
  activeTag,
  onToggle,
  onClear,
}: {
  tags: string[];
  activeTag: string | null;
  onToggle: (tag: string) => void;
  onClear: () => void;
}) {
  if (!tags.length) return null;
  const once = tags.length < 14
    ? Array.from({ length: Math.ceil(14 / tags.length) }, () => tags).flat()
    : tags;
  const loop = [...once, ...once];
  const duration = Math.max(36, tags.length * 2.4);

  return (
    <div
      className="air-tag-ticker fixed inset-x-0 z-40 border-y border-white/10 bg-[#071018]/80 text-white backdrop-blur-xl"
      style={{ bottom: "calc(var(--support-h, 3.55rem) + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex h-12 items-center">
        <span className="shrink-0 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Tags
        </span>
        {activeTag ? (
          <button
            type="button"
            onClick={onClear}
            className="mr-1 inline-flex h-8 shrink-0 items-center rounded-full border border-white/20 bg-white/[0.06] px-3 text-[0.72rem] font-medium text-white/80 hover:bg-white/10"
          >
            Tout
          </button>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="air-tag-track flex w-max items-center py-1"
            style={{ animationDuration: `${duration}s` }}
          >
            {loop.map((tag, index) => {
              const active = activeTag?.toLocaleLowerCase("fr") === tag.toLocaleLowerCase("fr");
              return (
                <button
                  key={`${tag}-${index}`}
                  type="button"
                  onClick={() => onToggle(tag)}
                  aria-pressed={active}
                  className={`mx-1 inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[0.78rem] font-medium transition ${
                    active
                      ? "border-white/40 bg-white/12 text-white"
                      : "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-white/28 hover:bg-white/[0.08]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

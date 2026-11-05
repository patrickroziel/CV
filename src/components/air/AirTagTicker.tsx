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
      style={{ bottom: "calc(3.55rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex h-9 items-center">
        <span className="shrink-0 border-r border-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
          Tags
        </span>
        {activeTag ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 border-r border-white/10 px-3 text-[10px] uppercase tracking-[0.16em] text-white/80 hover:text-white"
          >
            Tout
          </button>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            className="air-tag-track flex w-max items-center"
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
                  className={`inline-flex shrink-0 items-center px-3 text-[12px] tracking-wide transition ${
                    active ? "text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span className={active ? "underline decoration-white/50 underline-offset-4" : ""}>
                    {tag}
                  </span>
                  <span aria-hidden className="ml-3 text-white/25">
                    ·
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

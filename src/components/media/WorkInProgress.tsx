import { cn } from "@/lib/utils";

export function WorkInProgress({ className }: { className?: string }) {
  return (
    <div className={cn("blob-wip", className)} role="img" aria-label="Work in progress">
      <span className="blob-wip__mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="blob-wip__gem">
          <path d="M24 6 38 16.5 24 42 10 16.5 24 6Z" />
          <path d="M10 16.5h28M24 6 18 16.5 24 42 30 16.5 24 6Z" />
        </svg>
      </span>
      <span className="blob-wip__kicker">Work in progress</span>
    </div>
  );
}

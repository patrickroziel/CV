import { cn } from "@/lib/utils";

export function WorkInProgress({ className }: { className?: string }) {
  return (
    <div className={cn("blob-wip", className)} role="img" aria-label="Work in progress">
      <span className="blob-wip__dots" aria-hidden="true">
        <i /><i /><i />
      </span>
      <span className="blob-wip__label">work in progress</span>
    </div>
  );
}

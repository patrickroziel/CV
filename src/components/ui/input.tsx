import * as React from "react";
import { handlePlainPaste } from "@/lib/clipboard-paste";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onPaste, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/40 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        onPaste={(e) => {
          const t = type ?? "text";
          if (
            t === "text" ||
            t === "search" ||
            t === "url" ||
            t === "tel" ||
            t === "email" ||
            t === "password" ||
            t === undefined
          ) {
            handlePlainPaste(e, true);
          }
          onPaste?.(e);
        }}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

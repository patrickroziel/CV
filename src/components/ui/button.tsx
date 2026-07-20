import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-teal-300 text-zinc-950 shadow-lg shadow-teal-300/20 hover:bg-teal-200 hover:shadow-teal-300/30",
        secondary:
          "border border-white/18 bg-white/10 text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)] backdrop-blur-xl hover:border-white/28 hover:bg-white/15",
        outline:
          "border border-white/20 bg-white/[0.03] text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-md hover:border-white/30 hover:bg-white/10",
        ghost:
          "text-zinc-300 hover:bg-white/10 hover:text-zinc-50 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
        destructive: "bg-red-600/90 text-white hover:bg-red-600",
        link: "text-teal-300 underline-offset-4 hover:underline",
        amber:
          "bg-amber-400/90 text-zinc-950 shadow-lg shadow-amber-400/15 hover:bg-amber-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

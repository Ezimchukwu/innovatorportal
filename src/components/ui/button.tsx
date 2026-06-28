import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] transform-gpu",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg hover:shadow-destructive/20 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border/80 bg-background/60 hover:bg-muted/60 hover:text-foreground hover:border-primary/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "bg-transparent hover:bg-muted/60 hover:text-foreground hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        hero:
          "bg-[radial-gradient(circle_at_10%_0,hsla(46,96%,72%,0.85),hsla(259,72%,50%,0.95))] text-primary-foreground shadow-[var(--shadow-glow)] hover:brightness-110 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 active:translate-y-0",
        subtle:
          "bg-card/70 text-foreground border border-border/70 hover:bg-card hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5 active:translate-y-0",
        pill:
          "bg-[var(--gradient-pill)] text-primary-foreground shadow-md hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 active:translate-y-0",
        // New interactive variants for different user types
        teen: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 hover:scale-105 active:scale-95 animate-pulse-slow",
        parent: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 border-2 border-transparent hover:border-blue-300/50",
        school: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 border border-emerald-400/30",
        playful: "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-1 hover:rotate-1 active:rotate-0 transition-all duration-500",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

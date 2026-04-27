import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border border-white/20 bg-gradient-to-r from-primary via-orange-500 to-primary-dark text-white shadow-[0_18px_45px_-18px_rgba(255,107,0,0.95)] hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-20px_rgba(255,107,0,1)]",
        secondary:
          "border border-white/60 bg-white/85 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_34px_-26px_rgba(24,17,12,0.7)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white",
        outline:
          "border border-primary/35 bg-primary/5 text-primary shadow-sm hover:-translate-y-0.5 hover:bg-primary/10",
        ghost: "text-foreground hover:bg-primary-light/70",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
        ref={ref as React.LegacyRef<HTMLButtonElement>}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

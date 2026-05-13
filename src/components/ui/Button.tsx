import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/Cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-md hover:bg-primary/90 shadow-primary/20",
        secondary: "bg-white border border-border text-foreground hover:border-primary",
        ghost: "text-foreground hover:bg-canvas",
        soft: "bg-primary-soft text-primary hover:bg-primary/20",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/Cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full border-none bg-transparent text-sm md:text-base font-medium",
      "text-foreground placeholder:text-muted",
      "focus:outline-none focus:ring-0",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

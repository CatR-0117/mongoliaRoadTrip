import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/Cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("bg-white border border-border rounded-2xl shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

export const CardBody = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
));
CardBody.displayName = "CardBody";

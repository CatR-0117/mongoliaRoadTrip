import { type HTMLAttributes } from "react";
import { cn } from "@/lib/Cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    className={cn("animate-pulse rounded-lg bg-border/70", className)}
    aria-hidden="true"
    {...props}
  />
);

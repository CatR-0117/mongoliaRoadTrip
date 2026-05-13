import type { CSSProperties } from "react";
import { cn } from "@/lib/Cn";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
};

export const Icon = ({ name, className, filled, ariaLabel, style }: IconProps) => (
  <span
    aria-hidden={ariaLabel ? undefined : true}
    aria-label={ariaLabel}
    style={style}
    className={cn(
      "material-symbols-outlined",
      filled && "material-symbols-filled",
      "select-none align-middle leading-none",
      className,
    )}
  >
    {name}
  </span>
);

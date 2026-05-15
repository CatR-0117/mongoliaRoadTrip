"use client";

import { CATEGORY_SPECS } from "@/app/(main)/_utils/Categories";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/Cn";
import type { PlaceCategory } from "@/types/Place";

type FilterBarProps = {
  isSelected: (id: PlaceCategory) => boolean;
  onToggle: (id: PlaceCategory) => void;
  onSetAll: (on: boolean) => void;
  allSelected: boolean;
  totalPlaces: number;
};

const CHIP_BASE =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 sm:px-5 font-semibold text-sm transition-colors shadow-sm select-none";

export const FilterBar = ({
  isSelected,
  onToggle,
  onSetAll,
  allSelected,
  totalPlaces,
}: FilterBarProps) => (
  <div className="w-full sticky top-[64px] z-30 bg-canvas/95 backdrop-blur-sm border-b border-border">
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-3 flex gap-2 sm:gap-3 overflow-x-auto md:overflow-visible md:flex-wrap items-center">
      <button
        type="button"
        onClick={() => onSetAll(!allSelected)}
        className={cn(
          CHIP_BASE,
          allSelected
            ? "bg-primary text-white"
            : "bg-white border border-border text-foreground hover:border-primary",
        )}
      >
        <Icon name="auto_awesome" className="text-base" />
        <span>{allSelected ? "All categories" : "Show all"}</span>
      </button>
      {CATEGORY_SPECS.map((spec) => {
        const active = isSelected(spec.id);
        return (
          <button
            type="button"
            key={spec.id}
            onClick={() => onToggle(spec.id)}
            className={cn(
              CHIP_BASE,
              active
                ? "bg-primary text-white"
                : "bg-white border border-border text-foreground hover:border-primary",
            )}
            aria-pressed={active}
          >
            <Icon
              name={spec.icon}
              className={cn("text-base", !active && "text-primary")}
            />
            <span>{spec.label}</span>
          </button>
        );
      })}
      <div className="shrink-0 md:ml-auto text-xs font-semibold text-muted">
        {totalPlaces > 0 ? `${totalPlaces} places along route` : null}
      </div>
    </div>
  </div>
);

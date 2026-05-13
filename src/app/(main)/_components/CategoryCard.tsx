"use client";

import type { CategorySpec } from "@/app/(main)/_utils/Categories";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/Cn";
import type { Place } from "@/types/Place";

type CategoryCardProps = {
  spec: CategorySpec;
  places: Place[];
  onRandomPick: (place: Place) => void;
};

const pickRandom = (places: Place[]): Place => places[Math.floor(Math.random() * places.length)];

const closest = (places: Place[]): Place =>
  places.reduce((best, p) => (p.distanceFromRoadMeters < best.distanceFromRoadMeters ? p : best));

export const CategoryCard = ({ spec, places, onRandomPick }: CategoryCardProps) => {
  const empty = places.length === 0;
  const preview = empty ? null : closest(places);
  const handleClick = () => {
    if (!empty) onRandomPick(pickRandom(places));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={empty}
      className={cn(
        "group bg-white border border-border rounded-2xl p-5 text-left transition-all shadow-sm",
        "hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0",
        "focus:outline-none focus:ring-4 focus:ring-primary/20",
      )}
      style={{ borderTopColor: empty ? undefined : spec.color }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="size-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${spec.color}1a` }}
        >
          <Icon name={spec.icon} className="text-2xl" style={{ color: spec.color }} />
        </div>
        <span
          className="text-3xl font-black tabular-nums leading-none"
          style={{ color: empty ? "var(--color-muted)" : spec.color }}
        >
          {places.length}
        </span>
      </div>
      <h3 className="text-base font-extrabold text-foreground">{spec.label}</h3>
      <p className="text-xs text-muted mt-1 truncate">
        {empty ? "No places in this category" : `Closest: ${preview?.name}`}
      </p>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
        <Icon
          name={empty ? "block" : "shuffle"}
          className="text-base"
          style={{ color: empty ? undefined : spec.color }}
        />
        <span>{empty ? "Unavailable" : "Show a random stop"}</span>
        {empty ? null : (
          <Icon name="arrow_forward" className="text-base ml-auto opacity-0 group-hover:opacity-100" />
        )}
      </div>
    </button>
  );
};

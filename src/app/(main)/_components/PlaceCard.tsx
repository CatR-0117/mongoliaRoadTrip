"use client";

import { categorySpec } from "@/app/(main)/_utils/Categories";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/Cn";
import type { Place } from "@/types/Place";

type PlaceCardProps = {
  place: Place;
  onClose?: () => void;
  variant?: "popup" | "inline";
};

const formatCoord = (coord: readonly [number, number]): string =>
  `${coord[1].toFixed(4)}, ${coord[0].toFixed(4)}`;

const formatMeters = (m: number): string => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

export const PlaceCard = ({ place, onClose, variant = "popup" }: PlaceCardProps) => {
  const spec = categorySpec(place.category);
  const isPopup = variant === "popup";

  return (
    <Card className={cn("min-w-[260px]", isPopup ? "shadow-xl" : "shadow-none border-border")}>
      <div className="p-4 flex items-start gap-3">
        <div
          className="size-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${spec.color}1a` }}
        >
          <Icon name={spec.icon} className="text-xl" style={{ color: spec.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {spec.label}
              </span>
              <h4 className="text-sm font-extrabold text-foreground leading-snug truncate">
                {place.name}
              </h4>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                <Icon name="close" className="text-lg" />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted font-medium">
            <span className="flex items-center gap-1">
              <Icon name="straighten" className="text-sm" />
              {place.distanceFromStartKm} km from start
            </span>
            <span className="flex items-center gap-1">
              <Icon name="route" className="text-sm" />
              {formatMeters(place.distanceFromRoadMeters)} off road
            </span>
            <span className="flex items-center gap-1">
              <Icon name="my_location" className="text-sm" />
              {formatCoord(place.coord)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

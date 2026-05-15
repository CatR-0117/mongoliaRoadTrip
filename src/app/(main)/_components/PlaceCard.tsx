"use client";

import Image from "next/image";
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
    <Card
      className={cn(
        "min-w-[260px] overflow-hidden",
        isPopup ? "shadow-xl" : "shadow-none border-border h-full",
      )}
    >
      <div className={cn("flex gap-3", isPopup ? "flex-col p-4" : "p-3 sm:p-4")}>
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl bg-canvas",
            isPopup ? "h-32 w-full" : "h-24 w-28 sm:w-32",
          )}
        >
          <Image
            src={place.imageUrl}
            alt={place.name}
            fill
            sizes={isPopup ? "(max-width: 768px) 100vw, 360px" : "(max-width: 768px) 112px, 128px"}
            className="object-cover"
          />
          <div
            className="absolute left-2 top-2 size-8 rounded-full bg-white/95 flex items-center justify-center shadow-sm"
            style={{ color: spec.color }}
          >
            <Icon name={spec.icon} className="text-lg" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {spec.label}
              </span>
              <h4 className="text-sm font-extrabold text-foreground leading-snug line-clamp-2">
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
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-foreground">
            <span className="flex items-center gap-1">
              <Icon name="star" filled className="text-sm text-amber-500" />
              {place.rating.toFixed(1)}
            </span>
            <span className="flex min-w-0 items-center gap-1 text-muted">
              <Icon name="place" className="text-sm" />
              <span className="truncate">{place.location}</span>
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-2">
            {place.description}
          </p>
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

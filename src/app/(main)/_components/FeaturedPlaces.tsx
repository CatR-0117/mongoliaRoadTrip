"use client";

import { PlaceCard } from "@/app/(main)/_components/PlaceCard";
import type { Place } from "@/types/Place";

type FeaturedPlacesProps = {
  places: Place[];
  onPick: (place: Place) => void;
};

const MAX_FEATURED = 12;

export const FeaturedPlaces = ({ places, onPick }: FeaturedPlacesProps) => {
  const featured = places.slice(0, MAX_FEATURED);
  if (featured.length === 0) return null;

  return (
    <section>
      <header className="mb-5">
        <h2 className="text-2xl font-extrabold text-foreground">Notable places on the way</h2>
        <p className="text-sm text-muted mt-1">
          Popular lakes, parks, viewpoints, landmarks, and attractions found near this route.
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {featured.map((place) => (
          <button
            type="button"
            key={place.id}
            onClick={() => onPick(place)}
            className="h-full text-left rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            <PlaceCard place={place} variant="inline" />
          </button>
        ))}
      </div>
    </section>
  );
};

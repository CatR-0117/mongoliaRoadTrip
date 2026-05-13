"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CategoryGrid } from "@/app/(main)/_components/CategoryGrid";
import { EmptyState } from "@/app/(main)/_components/EmptyState";
import { PlaceCard } from "@/app/(main)/_components/PlaceCard";
import { RouteHeader } from "@/app/(main)/_components/RouteHeader";
import { SkeletonMap } from "@/app/(main)/_components/SkeletonMap";
import { TripSummary } from "@/app/(main)/_components/TripSummary";
import type { Place, PlaceCategory } from "@/types/Place";
import type { RouteResult } from "@/types/Route";

const MapView = dynamic(
  () => import("@/app/(main)/_components/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <SkeletonMap /> },
);

type ResultsLayoutProps = {
  route: RouteResult | null;
  places: Place[];
  visibleCategories: ReadonlySet<PlaceCategory>;
  isRouteLoading: boolean;
  isPlacesLoading: boolean;
};

const renderPlacesBody = (
  route: RouteResult,
  places: Place[],
  visible: ReadonlySet<PlaceCategory>,
  isLoading: boolean,
  onPick: (place: Place) => void,
) => {
  if (isLoading && places.length === 0) {
    return (
      <EmptyState
        title="Loading places along your route"
        description="Sampling the polyline every 15 km and querying OpenStreetMap for nearby stops."
        icon="progress_activity"
      />
    );
  }
  if (places.length === 0) {
    return (
      <EmptyState
        title="No places returned"
        description="OpenStreetMap had nothing tagged along this corridor. Try a different route or widen your filters."
      />
    );
  }
  return (
    <div className="space-y-6">
      <TripSummary route={route} places={places} />
      <CategoryGrid places={places} visibleCategories={visible} onRandomPick={onPick} />
    </div>
  );
};

const routeKey = (route: RouteResult | null): string =>
  route ? `${route.from.name}|${route.to.name}|${route.distanceMeters}` : "none";

export const ResultsLayout = ({
  route,
  places,
  visibleCategories,
  isRouteLoading,
  isPlacesLoading,
}: ResultsLayoutProps) => {
  const [selected, setSelected] = useState<Place | null>(null);
  const [lastRouteKey, setLastRouteKey] = useState<string>(routeKey(route));
  const currentRouteKey = routeKey(route);
  if (currentRouteKey !== lastRouteKey) {
    setLastRouteKey(currentRouteKey);
    setSelected(null);
  }
  const visiblePlaces = places.filter((p) => visibleCategories.has(p.category));

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-6 space-y-6">
      {isRouteLoading && !route ? (
        <SkeletonMap />
      ) : (
        <MapView
          route={route}
          places={visiblePlaces}
          visibleCategories={visibleCategories}
          focused={selected}
          onPlaceClick={setSelected}
        />
      )}
      {route ? <RouteHeader route={route} placeCount={visiblePlaces.length} /> : null}
      {selected ? (
        <PlaceCard place={selected} onClose={() => setSelected(null)} variant="popup" />
      ) : null}
      {route ? renderPlacesBody(route, places, visibleCategories, isPlacesLoading, setSelected) : null}
    </div>
  );
};

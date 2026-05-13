"use client";

import { useEffect, useState } from "react";
import { ErrorBanner } from "@/app/(main)/_components/ErrorBanner";
import { FilterBar } from "@/app/(main)/_components/FilterBar";
import { HeroSearch } from "@/app/(main)/_components/HeroSearch";
import { ResultsLayout } from "@/app/(main)/_components/ResultsLayout";
import { useFilters } from "@/app/(main)/_features/UseFilters";
import { useGeolocation } from "@/app/(main)/_features/UseGeolocation";
import { useTripQuery } from "@/app/(main)/_features/UseTripQuery";
import { PLACE_CATEGORIES } from "@/types/Place";
import type { RouteRequest } from "@/types/Route";

const buildErrorTitle = (err: Error | null): string => {
  if (!err) return "";
  if (err.message.includes("No location found")) return "Location not found";
  return "Couldn't plan your route";
};

export const TripPlanner = () => {
  const [request, setRequest] = useState<RouteRequest | null>(null);
  const filters = useFilters();
  const geolocation = useGeolocation();
  const { route, places } = useTripQuery(request);

  useEffect(() => {
    if (geolocation.status === "idle") geolocation.request();
  }, [geolocation]);

  const error = route.error ?? places.error;
  const placesData = places.data ?? [];
  const allSelected = filters.selected.size === PLACE_CATEGORIES.length;

  const handleSubmit = (from: string, to: string) => setRequest({ from, to });
  const handleRetry = () => {
    if (route.error) route.refetch();
    else places.refetch();
  };

  return (
    <>
      <HeroSearch
        isLoading={route.isLoading || places.isLoading}
        geolocation={geolocation}
        onSubmit={handleSubmit}
        initialFrom={request?.from ?? geolocation.point?.name}
        initialTo={request?.to}
      />
      {error ? (
        <ErrorBanner
          title={buildErrorTitle(error as Error)}
          message={(error as Error).message}
          onRetry={handleRetry}
        />
      ) : null}
      {request ? (
        <>
          <FilterBar
            isSelected={filters.isSelected}
            onToggle={filters.toggle}
            onSetAll={filters.setAll}
            allSelected={allSelected}
            totalPlaces={placesData.length}
          />
          <ResultsLayout
            route={route.data ?? null}
            places={placesData}
            visibleCategories={filters.selected}
            isRouteLoading={route.isLoading}
            isPlacesLoading={places.isLoading}
          />
        </>
      ) : null}
    </>
  );
};

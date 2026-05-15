"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Place } from "@/types/Place";
import type { RouteRequest, RouteResult, ApiErrorBody } from "@/types/Route";

const ROUTE_STALE_MS = 24 * 60 * 60 * 1000;
const PLACES_STALE_MS = 12 * 60 * 60 * 1000;

const postJson = async <T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
};

const fetchRouteRequest = (
  input: RouteRequest,
  signal?: AbortSignal,
): Promise<RouteResult> => postJson("/api/route", input, signal);

const fetchPlacesRequest = (
  coordinates: RouteResult["coordinates"],
  signal?: AbortSignal,
): Promise<Place[]> => postJson("/api/places", { coordinates }, signal);

export type TripQuery = {
  route: UseQueryResult<RouteResult, Error>;
  places: UseQueryResult<Place[], Error>;
};

export const useTripQuery = (request: RouteRequest | null): TripQuery => {
  const route = useQuery({
    queryKey: ["route", request?.from, request?.to],
    queryFn: ({ signal }) => fetchRouteRequest(request as RouteRequest, signal),
    enabled: Boolean(request && request.from && request.to),
    staleTime: ROUTE_STALE_MS,
    gcTime: ROUTE_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const places = useQuery({
    queryKey: ["places", request?.from, request?.to],
    queryFn: ({ signal }) => fetchPlacesRequest(route.data?.coordinates ?? [], signal),
    enabled: Boolean(route.data?.coordinates?.length),
    staleTime: PLACES_STALE_MS,
    gcTime: PLACES_STALE_MS,
    refetchOnWindowFocus: false,
  });

  return { route, places };
};

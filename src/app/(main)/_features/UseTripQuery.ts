"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Place } from "@/types/Place";
import type { RouteRequest, RouteResult, ApiErrorBody } from "@/types/Route";

const postJson = async <T>(url: string, body: unknown): Promise<T> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
};

const fetchRouteRequest = (input: RouteRequest): Promise<RouteResult> =>
  postJson("/api/route", input);

const fetchPlacesRequest = (coordinates: RouteResult["coordinates"]): Promise<Place[]> =>
  postJson("/api/places", { coordinates });

export type TripQuery = {
  route: UseQueryResult<RouteResult, Error>;
  places: UseQueryResult<Place[], Error>;
};

export const useTripQuery = (request: RouteRequest | null): TripQuery => {
  const route = useQuery({
    queryKey: ["route", request?.from, request?.to],
    queryFn: () => fetchRouteRequest(request as RouteRequest),
    enabled: Boolean(request && request.from && request.to),
  });

  const places = useQuery({
    queryKey: ["places", request?.from, request?.to],
    queryFn: () => fetchPlacesRequest(route.data?.coordinates ?? []),
    enabled: Boolean(route.data?.coordinates?.length),
  });

  return { route, places };
};

"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { Place } from "@/types/Place";
import type { ApiErrorBody, RouteResult } from "@/types/Route";

export type SummaryResponse =
  | { enabled: true; summary: string }
  | { enabled: false };

const fetchSummary = async (route: RouteResult, places: Place[]): Promise<SummaryResponse> => {
  const res = await fetch("/api/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ route, places }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(data?.error ?? `Summary request failed: ${res.status}`);
  }
  return (await res.json()) as SummaryResponse;
};

const summaryKey = (route: RouteResult, placeCount: number): string =>
  `${route.from.name}|${route.to.name}|${Math.round(route.distanceMeters / 1000)}|${placeCount}`;

export const useSummaryQuery = (
  route: RouteResult | null,
  places: Place[],
): UseQueryResult<SummaryResponse, Error> =>
  useQuery({
    queryKey: ["summary", route ? summaryKey(route, places.length) : null],
    queryFn: () => fetchSummary(route as RouteResult, places),
    enabled: Boolean(route && places.length > 0),
    staleTime: 60 * 60 * 1000,
    retry: 0,
  });

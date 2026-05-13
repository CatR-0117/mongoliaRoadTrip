import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/Env";
import { safeFetch } from "@/lib/Fetcher";
import { withCache, cacheKey } from "@/lib/ServerCache";
import type { Bbox, Coord } from "@/types/Route";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

const responseSchema = z.object({
  bbox: z.array(z.number()).length(4),
  features: z
    .array(
      z.object({
        geometry: z.object({
          type: z.literal("LineString"),
          coordinates: z.array(z.array(z.number()).length(2)),
        }),
        properties: z.object({
          summary: z.object({
            distance: z.number(),
            duration: z.number(),
          }),
        }),
      }),
    )
    .min(1),
});

export type RouteDirections = {
  coordinates: Coord[];
  distanceMeters: number;
  durationSeconds: number;
  bbox: Bbox;
};

const callOrs = async (from: Coord, to: Coord, apiKey: string): Promise<RouteDirections> => {
  const res = await safeFetch({
    url: ORS_URL,
    init: {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        Accept: "application/geo+json, application/json",
      },
      body: JSON.stringify({ coordinates: [from, to] }),
      cache: "no-store",
    },
    timeoutMs: 20_000,
  });
  if (!res.ok) throw new Error(`OpenRouteService ${res.status}`);
  const parsed = responseSchema.parse(await res.json());
  const feature = parsed.features[0];
  const coordinates = feature.geometry.coordinates.map((c) => [c[0], c[1]] as Coord);
  const bbox = parsed.bbox as unknown as Bbox;
  return {
    coordinates,
    distanceMeters: feature.properties.summary.distance,
    durationSeconds: feature.properties.summary.duration,
    bbox,
  };
};

const round4 = (n: number): string => n.toFixed(4);

export const fetchRoute = async (from: Coord, to: Coord): Promise<RouteDirections> => {
  const env = getServerEnv();
  const loader = withCache(() => callOrs(from, to, env.ORS_API_KEY), {
    keyParts: ["route", cacheKey(round4(from[0]), round4(from[1]), round4(to[0]), round4(to[1]))],
    revalidateSeconds: 24 * 60 * 60,
    tags: ["route"],
  });
  return loader();
};

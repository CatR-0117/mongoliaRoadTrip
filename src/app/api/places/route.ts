import { NextResponse } from "next/server";
import { z } from "zod";
import { samplePolyline } from "@/app/(main)/_utils/SamplePolyline";
import { projectOntoPolyline } from "@/app/(main)/_utils/DistanceAlong";
import { dedupePlaces } from "@/app/(main)/_utils/DedupePlaces";
import { fetchPois, type RawPlace } from "@/services/PoiService";
import type { Coord } from "@/types/Route";
import { PLACE_CATEGORIES, type Place } from "@/types/Place";
import type { ApiErrorBody } from "@/types/Route";

export const maxDuration = 60;

const coordSchema = z.tuple([z.number(), z.number()]);
const MAX_RESULTS = 180;
const MAX_PER_CATEGORY = 36;

const bodySchema = z.object({
  coordinates: z.array(coordSchema).min(2),
  categories: z.array(z.enum(PLACE_CATEGORIES)).optional(),
});

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const routeProximityScore = (distanceFromRoadMeters: number): number =>
  Math.max(0, 30 - distanceFromRoadMeters / 1000);

const ratingFromScore = (score: number, distanceFromRoadMeters: number): number => {
  const routePenalty = Math.min(distanceFromRoadMeters / 1000, 30) * 0.01;
  return Number(clamp(3.6 + score / 100 - routePenalty, 3.5, 4.9).toFixed(1));
};

const capResults = (places: Place[]): Place[] => {
  const counts = new Map<string, number>();
  const capped: Place[] = [];
  for (const place of places) {
    const count = counts.get(place.category) ?? 0;
    if (count >= MAX_PER_CATEGORY) continue;
    capped.push(place);
    counts.set(place.category, count + 1);
    if (capped.length >= MAX_RESULTS) break;
  }
  return capped;
};

const enrichPlace = (raw: RawPlace, line: Coord[]): Place => {
  const projection = projectOntoPolyline(raw.coord, line);
  const popularityScore = raw.baseScore + routeProximityScore(projection.distanceFromRoadMeters);
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    coord: raw.coord,
    location: raw.location,
    imageUrl: raw.imageUrl,
    rating: ratingFromScore(popularityScore, projection.distanceFromRoadMeters),
    description: raw.description,
    popularityScore: Number(popularityScore.toFixed(3)),
    distanceFromStartKm: projection.distanceFromStartKm,
    distanceFromRoadMeters: projection.distanceFromRoadMeters,
  };
};

const errorResponse = (err: unknown): NextResponse<ApiErrorBody> => {
  const detail = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json(
    { error: "Could not load places along this route.", detail },
    { status: 502 },
  );
};

export const POST = async (request: Request): Promise<NextResponse<Place[] | ApiErrorBody>> => {
  try {
    const json = await request.json();
    const parsed = bodySchema.parse(json);
    const line = parsed.coordinates.map(([lon, lat]) => [lon, lat] as Coord);
    const samples = samplePolyline(line);
    const allowedCategories = parsed.categories ? new Set(parsed.categories) : null;
    const rawPlaces = await fetchPois(samples);
    const enriched = rawPlaces
      .map((p) => enrichPlace(p, line))
      .filter((place) => !allowedCategories || allowedCategories.has(place.category));
    const deduped = dedupePlaces(enriched);
    deduped.sort(
      (a, b) =>
        b.popularityScore - a.popularityScore ||
        a.distanceFromStartKm - b.distanceFromStartKm,
    );
    return NextResponse.json(capResults(deduped));
  } catch (err) {
    return errorResponse(err);
  }
};

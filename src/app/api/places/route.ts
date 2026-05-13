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

const bodySchema = z.object({
  coordinates: z.array(coordSchema).min(2),
  categories: z.array(z.enum(PLACE_CATEGORIES)).optional(),
});

const enrichPlace = (raw: RawPlace, line: Coord[]): Place => {
  const projection = projectOntoPolyline(raw.coord, line);
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    coord: raw.coord,
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
    const rawPlaces = await fetchPois(samples);
    const enriched = rawPlaces.map((p) => enrichPlace(p, line));
    const deduped = dedupePlaces(enriched);
    deduped.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
    return NextResponse.json(deduped);
  } catch (err) {
    return errorResponse(err);
  }
};

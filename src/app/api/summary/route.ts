import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTripSummary } from "@/services/SummaryService";
import { hasGemini } from "@/lib/Env";
import { PLACE_CATEGORIES } from "@/types/Place";
import type { ApiErrorBody, RouteResult } from "@/types/Route";

const coordSchema = z.tuple([z.number(), z.number()]);

const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(PLACE_CATEGORIES),
  coord: coordSchema,
  location: z.string(),
  imageUrl: z.string(),
  rating: z.number(),
  description: z.string(),
  popularityScore: z.number(),
  distanceFromStartKm: z.number(),
  distanceFromRoadMeters: z.number(),
});

const routePointSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  coord: coordSchema,
});

const bodySchema = z.object({
  route: z.object({
    from: routePointSchema,
    to: routePointSchema,
    coordinates: z.array(coordSchema).min(2),
    distanceMeters: z.number(),
    durationSeconds: z.number(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  }),
  places: z.array(placeSchema),
});

type SummaryBody = { summary: string; enabled: true } | { enabled: false };

export const POST = async (request: Request): Promise<NextResponse<SummaryBody | ApiErrorBody>> => {
  try {
    if (!hasGemini()) return NextResponse.json({ enabled: false });
    const json = await request.json();
    const parsed = bodySchema.parse(json);
    const summary = await generateTripSummary(parsed.route as RouteResult, parsed.places);
    return NextResponse.json({ summary, enabled: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "AI summary failed", detail }, { status: 502 });
  }
};

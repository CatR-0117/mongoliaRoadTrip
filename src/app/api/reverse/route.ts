import { NextResponse } from "next/server";
import { z } from "zod";
import { reverseGeocode } from "@/services/GeocodeService";
import type { ApiErrorBody, RoutePoint } from "@/types/Route";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const GET = async (request: Request): Promise<NextResponse<RoutePoint | ApiErrorBody>> => {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      lat: searchParams.get("lat"),
      lon: searchParams.get("lon"),
    });
    const point = await reverseGeocode(parsed.lat, parsed.lon);
    return NextResponse.json(point);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "Reverse geocode failed", detail }, { status: 502 });
  }
};

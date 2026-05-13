import { NextResponse } from "next/server";
import { z } from "zod";
import { geocode } from "@/services/GeocodeService";
import { fetchRoute } from "@/services/RouteService";
import type { RouteResult, ApiErrorBody } from "@/types/Route";

const bodySchema = z.object({
  from: z.string().min(2).max(120),
  to: z.string().min(2).max(120),
});

const buildErrorMessage = (err: unknown): string => {
  if (err instanceof z.ZodError) return "Invalid input";
  if (err instanceof Error) return err.message;
  return "Unknown error";
};

const errorResponse = (err: unknown, status: number): NextResponse<ApiErrorBody> => {
  const message = buildErrorMessage(err);
  const friendly = message.includes("No location found")
    ? message
    : "Could not plan the route. Please try again.";
  return NextResponse.json({ error: friendly, detail: message }, { status });
};

export const POST = async (request: Request): Promise<NextResponse<RouteResult | ApiErrorBody>> => {
  try {
    const json = await request.json();
    const parsed = bodySchema.parse(json);
    const [fromPoint, toPoint] = await Promise.all([geocode(parsed.from), geocode(parsed.to)]);
    const directions = await fetchRoute(fromPoint.coord, toPoint.coord);
    const result: RouteResult = {
      from: fromPoint,
      to: toPoint,
      coordinates: directions.coordinates,
      distanceMeters: directions.distanceMeters,
      durationSeconds: directions.durationSeconds,
      bbox: directions.bbox,
    };
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, 502);
  }
};

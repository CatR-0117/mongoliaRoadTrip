import { haversineMeters } from "@/app/(main)/_utils/Haversine";
import type { Coord } from "@/types/Route";

const STEP_METERS = 15_000;

const interpolate = (a: Coord, b: Coord, t: number): Coord => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

export const samplePolyline = (coords: Coord[]): Coord[] => {
  if (coords.length < 2) return coords.slice();
  const out: Coord[] = [coords[0]];
  let accumulated = 0;
  let nextTarget = STEP_METERS;

  for (let i = 1; i < coords.length; i++) {
    const segStart = coords[i - 1];
    const segEnd = coords[i];
    const segLen = haversineMeters(segStart, segEnd);
    if (segLen === 0) continue;
    while (accumulated + segLen >= nextTarget) {
      const t = (nextTarget - accumulated) / segLen;
      out.push(interpolate(segStart, segEnd, t));
      nextTarget += STEP_METERS;
    }
    accumulated += segLen;
  }

  const last = coords[coords.length - 1];
  const tail = out[out.length - 1];
  if (haversineMeters(tail, last) > 500) out.push(last);
  return out;
};

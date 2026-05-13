import { haversineMeters } from "@/app/(main)/_utils/Haversine";
import type { Coord } from "@/types/Route";

export type ProjectionResult = {
  distanceFromStartKm: number;
  distanceFromRoadMeters: number;
};

type SegmentProjection = {
  cumulativeAtSegmentStartM: number;
  segmentLengthM: number;
  alongFraction: number;
  perpendicularM: number;
};

const projectOnSegment = (
  point: Coord,
  segA: Coord,
  segB: Coord,
  cumulativeAtA: number,
): SegmentProjection => {
  const segLen = haversineMeters(segA, segB);
  if (segLen === 0) {
    return {
      cumulativeAtSegmentStartM: cumulativeAtA,
      segmentLengthM: 0,
      alongFraction: 0,
      perpendicularM: haversineMeters(point, segA),
    };
  }
  const dx = segB[0] - segA[0];
  const dy = segB[1] - segA[1];
  const px = point[0] - segA[0];
  const py = point[1] - segA[1];
  const dot = px * dx + py * dy;
  const len2 = dx * dx + dy * dy;
  const tRaw = len2 === 0 ? 0 : dot / len2;
  const t = Math.max(0, Math.min(1, tRaw));
  const proj: Coord = [segA[0] + t * dx, segA[1] + t * dy];
  return {
    cumulativeAtSegmentStartM: cumulativeAtA,
    segmentLengthM: segLen,
    alongFraction: t,
    perpendicularM: haversineMeters(point, proj),
  };
};

export const projectOntoPolyline = (point: Coord, line: Coord[]): ProjectionResult => {
  let best: SegmentProjection | null = null;
  let cumulative = 0;
  for (let i = 1; i < line.length; i++) {
    const proj = projectOnSegment(point, line[i - 1], line[i], cumulative);
    if (best === null || proj.perpendicularM < best.perpendicularM) best = proj;
    cumulative += proj.segmentLengthM;
  }
  if (!best) return { distanceFromStartKm: 0, distanceFromRoadMeters: 0 };
  const alongM = best.cumulativeAtSegmentStartM + best.alongFraction * best.segmentLengthM;
  return {
    distanceFromStartKm: Math.round(alongM / 100) / 10,
    distanceFromRoadMeters: Math.round(best.perpendicularM),
  };
};

import { haversineMeters } from "@/app/(main)/_utils/Haversine";
import type { Place } from "@/types/Place";

const NEAR_THRESHOLD_M = 50;

const sameNameNear = (a: Place, b: Place): boolean =>
  a.name.toLowerCase() === b.name.toLowerCase() &&
  haversineMeters(a.coord, b.coord) <= NEAR_THRESHOLD_M;

export const dedupePlaces = (places: Place[]): Place[] => {
  const byId = new Map<string, Place>();
  for (const p of places) {
    if (!byId.has(p.id)) byId.set(p.id, p);
  }
  const unique = Array.from(byId.values());
  const kept: Place[] = [];
  for (const candidate of unique) {
    const collision = kept.find((k) => sameNameNear(k, candidate));
    if (!collision) kept.push(candidate);
  }
  return kept;
};

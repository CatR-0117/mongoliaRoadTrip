import { haversineMeters } from "@/app/(main)/_utils/Haversine";
import type { Place } from "@/types/Place";

const NEAR_THRESHOLD_M = 50;

const sameNameNear = (a: Place, b: Place): boolean =>
  a.name.toLowerCase() === b.name.toLowerCase() &&
  haversineMeters(a.coord, b.coord) <= NEAR_THRESHOLD_M;

export const dedupePlaces = (places: Place[]): Place[] => {
  const byId = new Map<string, Place>();
  for (const p of places) {
    const existing = byId.get(p.id);
    if (!existing || p.popularityScore > existing.popularityScore) byId.set(p.id, p);
  }
  const unique = Array.from(byId.values());
  const kept: Place[] = [];
  for (const candidate of unique) {
    const collisionIndex = kept.findIndex((k) => sameNameNear(k, candidate));
    if (collisionIndex === -1) {
      kept.push(candidate);
    } else if (candidate.popularityScore > kept[collisionIndex].popularityScore) {
      kept[collisionIndex] = candidate;
    }
  }
  return kept;
};

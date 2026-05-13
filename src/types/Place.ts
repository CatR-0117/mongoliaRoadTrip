import type { Coord } from "@/types/Route";

export const PLACE_CATEGORIES = [
  "fuel",
  "cafe",
  "restaurant",
  "hotel",
  "camp",
  "scenic",
  "attraction",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  coord: Coord;
  distanceFromStartKm: number;
  distanceFromRoadMeters: number;
};

export type PlacesRequest = {
  coordinates: Coord[];
  categories?: PlaceCategory[];
};

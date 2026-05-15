import type { Coord } from "@/types/Route";

export const PLACE_CATEGORIES = [
  "fuel",
  "cafe",
  "restaurant",
  "hotel",
  "camp",
  "scenic",
  "lake",
  "viewpoint",
  "attraction",
  "landmark",
  "park",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  coord: Coord;
  location: string;
  imageUrl: string;
  rating: number;
  description: string;
  popularityScore: number;
  distanceFromStartKm: number;
  distanceFromRoadMeters: number;
};

export type PlacesRequest = {
  coordinates: Coord[];
  categories?: PlaceCategory[];
};

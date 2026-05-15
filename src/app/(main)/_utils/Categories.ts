import type { PlaceCategory } from "@/types/Place";

export type CategorySpec = {
  id: PlaceCategory;
  label: string;
  icon: string;
  color: string;
  keywords: readonly string[];
};

export const CATEGORY_SPECS: readonly CategorySpec[] = [
  { id: "fuel", label: "Fuel", icon: "local_gas_station", color: "#f59e0b", keywords: ["fuel", "gas", "petrol"] },
  { id: "cafe", label: "Cafe", icon: "local_cafe", color: "#a855f7", keywords: ["cafe", "coffee"] },
  { id: "restaurant", label: "Restaurants", icon: "restaurant", color: "#ef4444", keywords: ["restaurant", "food"] },
  { id: "hotel", label: "Hotels", icon: "hotel", color: "#3b82f6", keywords: ["hotel", "guest house", "lodging"] },
  { id: "camp", label: "Camps", icon: "camping", color: "#10b981", keywords: ["camp", "camping", "ger camp"] },
  { id: "scenic", label: "Scenic", icon: "landscape", color: "#ec4899", keywords: ["scenic", "picnic", "destination"] },
  { id: "lake", label: "Lakes", icon: "water", color: "#06b6d4", keywords: ["lake", "water", "reservoir"] },
  { id: "viewpoint", label: "Viewpoints", icon: "photo_camera", color: "#6366f1", keywords: ["viewpoint", "lookout", "panorama"] },
  { id: "attraction", label: "Attractions", icon: "attractions", color: "#0ea5e9", keywords: ["attraction", "museum", "historic", "tourism"] },
  { id: "landmark", label: "Landmarks", icon: "terrain", color: "#84cc16", keywords: ["peak", "cave", "cliff", "rock", "landmark"] },
  { id: "park", label: "Parks", icon: "forest", color: "#22c55e", keywords: ["national park", "nature reserve", "protected area"] },
] as const;

const SPEC_BY_ID = new Map<PlaceCategory, CategorySpec>(CATEGORY_SPECS.map((s) => [s.id, s]));

export const categorySpec = (id: PlaceCategory): CategorySpec => {
  const spec = SPEC_BY_ID.get(id);
  if (!spec) throw new Error(`Unknown category: ${id}`);
  return spec;
};

export const osmTagsToCategory = (tags: Record<string, string>): PlaceCategory | null => {
  if (tags.amenity === "fuel") return "fuel";
  if (tags.amenity === "cafe") return "cafe";
  if (tags.amenity === "restaurant") return "restaurant";
  if (tags.tourism === "hotel" || tags.tourism === "guest_house") return "hotel";
  if (tags.tourism === "camp_site") return "camp";
  if (tags.tourism === "viewpoint") return "viewpoint";
  if (tags.tourism === "picnic_site") return "scenic";
  if (tags.natural === "water" && ["lake", "reservoir", "pond"].includes(tags.water ?? "")) return "lake";
  if (tags.natural === "lake") return "lake";
  if (tags.boundary === "national_park") return "park";
  if (tags.boundary === "protected_area" || tags.leisure === "nature_reserve") return "park";
  if (tags.tourism === "attraction" || tags.tourism === "museum" || tags.tourism === "gallery") return "attraction";
  if (tags.historic) return "attraction";
  if (
    tags.natural &&
    ["peak", "volcano", "cave_entrance", "cliff", "rock", "stone", "spring", "hot_spring", "geyser", "valley"].includes(
      tags.natural,
    )
  ) {
    return "landmark";
  }
  return null;
};

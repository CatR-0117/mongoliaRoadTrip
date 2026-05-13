import type { PlaceCategory } from "@/types/Place";

export type CategorySpec = {
  id: PlaceCategory;
  label: string;
  icon: string;
  color: string;
  osmKey: "amenity" | "tourism";
  osmValue: string;
};

export const CATEGORY_SPECS: readonly CategorySpec[] = [
  { id: "fuel", label: "Fuel", icon: "local_gas_station", color: "#f59e0b", osmKey: "amenity", osmValue: "fuel" },
  { id: "cafe", label: "Cafe", icon: "local_cafe", color: "#a855f7", osmKey: "amenity", osmValue: "cafe" },
  { id: "restaurant", label: "Restaurants", icon: "restaurant", color: "#ef4444", osmKey: "amenity", osmValue: "restaurant" },
  { id: "hotel", label: "Hotels", icon: "hotel", color: "#3b82f6", osmKey: "tourism", osmValue: "hotel" },
  { id: "camp", label: "Camps", icon: "camping", color: "#10b981", osmKey: "tourism", osmValue: "camp_site" },
  { id: "scenic", label: "Scenic", icon: "photo_camera", color: "#ec4899", osmKey: "tourism", osmValue: "viewpoint" },
  { id: "attraction", label: "Attractions", icon: "attractions", color: "#0ea5e9", osmKey: "tourism", osmValue: "attraction" },
] as const;

const SPEC_BY_ID = new Map<PlaceCategory, CategorySpec>(CATEGORY_SPECS.map((s) => [s.id, s]));

export const categorySpec = (id: PlaceCategory): CategorySpec => {
  const spec = SPEC_BY_ID.get(id);
  if (!spec) throw new Error(`Unknown category: ${id}`);
  return spec;
};

export const osmTagToCategory = (key: string, value: string): PlaceCategory | null => {
  for (const spec of CATEGORY_SPECS) {
    if (spec.osmKey === key && spec.osmValue === value) return spec.id;
  }
  return null;
};

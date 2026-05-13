"use client";

import { useMemo } from "react";
import { CategoryCard } from "@/app/(main)/_components/CategoryCard";
import { CATEGORY_SPECS } from "@/app/(main)/_utils/Categories";
import type { Place, PlaceCategory } from "@/types/Place";

type CategoryGridProps = {
  places: Place[];
  visibleCategories: ReadonlySet<PlaceCategory>;
  onRandomPick: (place: Place) => void;
};

export const CategoryGrid = ({ places, visibleCategories, onRandomPick }: CategoryGridProps) => {
  const byCategory = useMemo(() => {
    const map = new Map<PlaceCategory, Place[]>();
    for (const spec of CATEGORY_SPECS) map.set(spec.id, []);
    for (const place of places) {
      if (!visibleCategories.has(place.category)) continue;
      map.get(place.category)?.push(place);
    }
    return map;
  }, [places, visibleCategories]);

  return (
    <section>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Stops by category</h2>
          <p className="text-sm text-muted mt-1">
            Tap any card to jump the map to a random stop in that category.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORY_SPECS.map((spec) => (
          <CategoryCard
            key={spec.id}
            spec={spec}
            places={byCategory.get(spec.id) ?? []}
            onRandomPick={onRandomPick}
          />
        ))}
      </div>
    </section>
  );
};

"use client";

import { useCallback, useMemo, useState } from "react";
import { PLACE_CATEGORIES, type PlaceCategory } from "@/types/Place";

export type FiltersState = {
  selected: ReadonlySet<PlaceCategory>;
  toggle: (id: PlaceCategory) => void;
  setAll: (on: boolean) => void;
  isSelected: (id: PlaceCategory) => boolean;
};

export const useFilters = (): FiltersState => {
  const [selected, setSelected] = useState<Set<PlaceCategory>>(() => new Set(PLACE_CATEGORIES));

  const toggle = useCallback((id: PlaceCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((on: boolean) => {
    setSelected(on ? new Set(PLACE_CATEGORIES) : new Set());
  }, []);

  const isSelected = useCallback(
    (id: PlaceCategory): boolean => selected.has(id),
    [selected],
  );

  return useMemo(
    () => ({ selected, toggle, setAll, isSelected }),
    [selected, toggle, setAll, isSelected],
  );
};

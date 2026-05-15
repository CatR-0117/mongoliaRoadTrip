"use client";

import maplibregl, { type LngLatLike, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { categorySpec } from "@/app/(main)/_utils/Categories";
import { MONGOLIA_CENTER, MONGOLIA_ZOOM, OSM_RASTER_STYLE } from "@/app/(main)/_utils/MapStyle";
import type { Place, PlaceCategory } from "@/types/Place";
import type { RouteResult } from "@/types/Route";

type MapViewProps = {
  route: RouteResult | null;
  places: Place[];
  visibleCategories: ReadonlySet<PlaceCategory>;
  focused: Place | null;
  onPlaceClick: (place: Place) => void;
};

const ROUTE_SOURCE = "route-source";
const ROUTE_LAYER = "route-layer";

const buildMarkerElement = (place: Place): HTMLDivElement => {
  const spec = categorySpec(place.category);
  const el = document.createElement("div");
  el.className =
    "size-9 rounded-full bg-white border-2 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform";
  el.style.borderColor = spec.color;
  el.innerHTML = `<span class="material-symbols-outlined" style="color:${spec.color};font-size:18px;line-height:1;">${spec.icon}</span>`;
  el.setAttribute("aria-label", `${spec.label}: ${place.name}`);
  return el;
};

const upsertRouteLayer = (map: Map, route: RouteResult | null): void => {
  const existing = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
  if (!route) {
    if (existing) existing.setData({ type: "FeatureCollection", features: [] });
    return;
  }
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: route.coordinates as unknown as number[][] },
    properties: {},
  };
  if (existing) {
    existing.setData(geojson);
    return;
  }
  map.addSource(ROUTE_SOURCE, { type: "geojson", data: geojson });
  map.addLayer({
    id: ROUTE_LAYER,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#137fec", "line-width": 4, "line-opacity": 0.9 },
  });
};

const fitToRoute = (map: Map, route: RouteResult): void => {
  const [w, s, e, n] = route.bbox;
  map.fitBounds(
    [
      [w, s],
      [e, n],
    ],
    { padding: 60, duration: 800 },
  );
};

const rebuildMarkers = (
  map: Map,
  markersRef: { current: maplibregl.Marker[] },
  places: Place[],
  visible: ReadonlySet<PlaceCategory>,
  onClick: (place: Place) => void,
): void => {
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];
  const filtered = places.filter((p) => visible.has(p.category));
  for (const place of filtered) {
    const el = buildMarkerElement(place);
    el.addEventListener("click", () => onClick(place));
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(place.coord as unknown as LngLatLike)
      .addTo(map);
    markersRef.current.push(marker);
  }
};

export const MapView = ({ route, places, visibleCategories, focused, onPlaceClick }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const readyRef = useRef(false);
  const latestPropsRef = useRef({ route, places, visibleCategories, onPlaceClick });

  useEffect(() => {
    latestPropsRef.current = { route, places, visibleCategories, onPlaceClick };
  }, [route, places, visibleCategories, onPlaceClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_RASTER_STYLE,
      center: MONGOLIA_CENTER,
      zoom: MONGOLIA_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      readyRef.current = true;
      const current = latestPropsRef.current;
      upsertRouteLayer(map, current.route);
      if (current.route) fitToRoute(map, current.route);
      rebuildMarkers(map, markersRef, current.places, current.visibleCategories, current.onPlaceClick);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    upsertRouteLayer(map, route);
    if (route) fitToRoute(map, route);
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    rebuildMarkers(map, markersRef, places, visibleCategories, onPlaceClick);
  }, [places, visibleCategories, onPlaceClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !focused) return;
    map.flyTo({
      center: focused.coord as unknown as LngLatLike,
      zoom: 13,
      speed: 1.2,
      essential: true,
    });
  }, [focused]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] md:h-[560px] rounded-2xl overflow-hidden border border-border shadow-sm bg-white"
    />
  );
};

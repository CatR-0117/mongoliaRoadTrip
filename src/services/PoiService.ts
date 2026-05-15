import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/Env";
import { safeFetch } from "@/lib/Fetcher";
import { withCache, cacheKey } from "@/lib/ServerCache";
import { osmTagsToCategory } from "@/app/(main)/_utils/Categories";
import type { Coord } from "@/types/Route";
import type { PlaceCategory } from "@/types/Place";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const BUSINESS_RADIUS_METERS = 5000;
const ATTRACTION_RADIUS_METERS = 25_000;
const BUSINESS_BATCH_SIZE = 32;
const ATTRACTION_BATCH_SIZE = 24;
const ATTRACTION_SAMPLE_STRIDE = 2;
const PARALLEL = 3;
const ELEMENT_TYPES = ["node", "way", "relation"] as const;

type OsmElementType = (typeof ELEMENT_TYPES)[number];
type QueryKind = "business" | "attraction";

export type RawPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  coord: Coord;
  location: string;
  imageUrl: string;
  description: string;
  baseScore: number;
};

const centerSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

const elementSchema = z.object({
  type: z.enum(ELEMENT_TYPES),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: centerSchema.optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const responseSchema = z.object({
  elements: z.array(z.union([elementSchema, z.object({ type: z.string() }).passthrough()])),
});

const BUSINESS_SELECTORS = [
  '["amenity"~"^(restaurant|cafe|fuel)$"]',
  '["tourism"~"^(hotel|guest_house|camp_site)$"]',
] as const;

const ATTRACTION_SELECTORS = [
  '["tourism"~"^(attraction|viewpoint|picnic_site|museum|gallery)$"]',
  '["natural"="water"]["water"~"^(lake|reservoir|pond)$"]',
  '["natural"="lake"]',
  '["natural"~"^(peak|volcano|cave_entrance|cliff|rock|stone|spring|hot_spring|geyser|valley)$"]',
  '["boundary"~"^(national_park|protected_area)$"]',
  '["leisure"="nature_reserve"]',
  '["historic"~"^(monument|memorial|archaeological_site|ruins|fort)$"]',
] as const;

const FALLBACK_IMAGES: Record<PlaceCategory, string> = {
  fuel: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=640&q=80",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=640&q=80",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=640&q=80",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=640&q=80",
  camp: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=640&q=80",
  scenic: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
  lake: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=640&q=80",
  viewpoint: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=640&q=80",
  attraction: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=640&q=80",
  landmark: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=640&q=80",
  park: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=640&q=80",
};

const CATEGORY_BASE_SCORE: Record<PlaceCategory, number> = {
  fuel: 38,
  cafe: 36,
  restaurant: 36,
  hotel: 42,
  camp: 46,
  scenic: 70,
  lake: 84,
  viewpoint: 76,
  attraction: 74,
  landmark: 78,
  park: 88,
};

const CATEGORY_DESCRIPTORS: Record<PlaceCategory, string> = {
  fuel: "fuel stop",
  cafe: "cafe",
  restaurant: "restaurant",
  hotel: "hotel",
  camp: "camp",
  scenic: "scenic destination",
  lake: "lake",
  viewpoint: "viewpoint",
  attraction: "tourist attraction",
  landmark: "natural landmark",
  park: "park or protected area",
};

const SAFE_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "commons.wikimedia.org",
  "upload.wikimedia.org",
]);

const buildSelectorClauses = (
  selectors: readonly string[],
  around: string,
): string =>
  selectors
    .flatMap((selector) => ELEMENT_TYPES.map((type) => `  ${type}${selector}(${around});`))
    .join("\n");

const buildAroundFilter = (radius: number, points: Coord[]): string => {
  const coords = points
    .map(([lon, lat]) => `${lat.toFixed(5)},${lon.toFixed(5)}`)
    .join(",");
  return `around:${radius},${coords}`;
};

const buildQuery = (batch: Coord[], kind: QueryKind): string => {
  const radius = kind === "business" ? BUSINESS_RADIUS_METERS : ATTRACTION_RADIUS_METERS;
  const selectors = kind === "business" ? BUSINESS_SELECTORS : ATTRACTION_SELECTORS;
  const clauses = buildSelectorClauses(selectors, buildAroundFilter(radius, batch));
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout tags center;`;
};

const round3 = (n: number): string => n.toFixed(3);

const firstTag = (tags: Record<string, string>, keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return null;
};

const truncate = (value: string, max = 145): string => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 3).trim()}...`;
};

const nameFromTags = (tags: Record<string, string>): string | null =>
  firstTag(tags, ["name:en", "name", "official_name", "alt_name"]);

const locationFromTags = (tags: Record<string, string>, coord: Coord): string =>
  firstTag(tags, ["addr:city", "addr:province", "is_in:province", "is_in", "addr:place"]) ??
  `${coord[1].toFixed(4)}, ${coord[0].toFixed(4)}`;

const commonsFileUrl = (value: string): string | null => {
  const file = value.replace(/^File:/i, "").trim();
  if (!file || /^Category:/i.test(value)) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
};

const imageFromTags = (tags: Record<string, string>, category: PlaceCategory): string => {
  const image = tags.image?.trim();
  if (image?.startsWith("http://") || image?.startsWith("https://")) {
    try {
      const url = new URL(image);
      if (SAFE_IMAGE_HOSTS.has(url.hostname)) return url.toString();
    } catch {
      return FALLBACK_IMAGES[category];
    }
  }
  if (image && /^File:/i.test(image)) return commonsFileUrl(image) ?? FALLBACK_IMAGES[category];
  const commons = tags.wikimedia_commons?.trim();
  if (commons && /^File:/i.test(commons)) return commonsFileUrl(commons) ?? FALLBACK_IMAGES[category];
  return FALLBACK_IMAGES[category];
};

const descriptionFromTags = (tags: Record<string, string>, category: PlaceCategory): string => {
  const provided = firstTag(tags, ["description:en", "description"]);
  if (provided) return truncate(provided);
  const descriptor = CATEGORY_DESCRIPTORS[category];
  if (tags.wikipedia) return `A notable ${descriptor} with Wikipedia coverage, mapped close to this route.`;
  if (tags.wikidata) return `A notable ${descriptor} cataloged in Wikidata and useful for route planning.`;
  if (category === "lake") return "A mapped lake or water destination near the travel corridor.";
  if (category === "park") return "A protected natural area or national park near this route.";
  if (category === "viewpoint") return "A mapped viewpoint that can add a scenic stop to the trip.";
  if (category === "landmark") return "A natural landmark near the route, useful for scenic detours.";
  if (category === "attraction") return "A tourism attraction that may be worth adding to the itinerary.";
  return `A ${descriptor} close to the route.`;
};

const elementCoord = (el: z.infer<typeof elementSchema>): Coord | null => {
  if (typeof el.lon === "number" && typeof el.lat === "number") return [el.lon, el.lat];
  if (el.center) return [el.center.lon, el.center.lat];
  return null;
};

const scoreFromTags = (
  category: PlaceCategory,
  tags: Record<string, string>,
  type: OsmElementType,
): number => {
  const typeBoost = type === "relation" ? 8 : type === "way" ? 5 : 0;
  const metadataBoost =
    (tags.wikipedia ? 12 : 0) +
    (tags.wikidata ? 10 : 0) +
    (tags.image || tags.wikimedia_commons ? 7 : 0) +
    (tags.website || tags.url ? 4 : 0) +
    (tags.heritage ? 4 : 0) +
    (tags["name:en"] ? 2 : 0);
  return CATEGORY_BASE_SCORE[category] + typeBoost + metadataBoost;
};

const elementToRawPlace = (el: unknown): RawPlace | null => {
  const parsed = elementSchema.safeParse(el);
  if (!parsed.success) return null;
  const tags = parsed.data.tags ?? {};
  const name = nameFromTags(tags);
  if (!name) return null;
  const category = osmTagsToCategory(tags);
  if (!category) return null;
  const coord = elementCoord(parsed.data);
  if (!coord) return null;
  return {
    id: `${parsed.data.type}/${parsed.data.id}`,
    name,
    category,
    coord,
    location: locationFromTags(tags, coord),
    imageUrl: imageFromTags(tags, category),
    description: descriptionFromTags(tags, category),
    baseScore: scoreFromTags(category, tags, parsed.data.type),
  };
};

const callOverpass = async (batch: Coord[], kind: QueryKind): Promise<RawPlace[]> => {
  const env = getServerEnv();
  const body = `data=${encodeURIComponent(buildQuery(batch, kind))}`;
  const res = await safeFetch({
    url: OVERPASS_URL,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": env.NOMINATIM_USER_AGENT,
      },
      body,
      cache: "no-store",
    },
    timeoutMs: 35_000,
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const parsed = responseSchema.parse(await res.json());
  return parsed.elements.map(elementToRawPlace).filter((p): p is RawPlace => p !== null);
};

type PoiBatch = {
  kind: QueryKind;
  points: Coord[];
};

const cachedBatch = (batch: PoiBatch): Promise<RawPlace[]> => {
  const key = batch.points.map(([lon, lat]) => `${round3(lon)},${round3(lat)}`).join("|");
  return withCache(() => callOverpass(batch.points, batch.kind), {
    keyParts: ["poi", batch.kind, cacheKey(key)],
    revalidateSeconds: 12 * 60 * 60,
    tags: ["poi"],
  })();
};

const chunkRoute = (points: Coord[], size: number): Coord[][] => {
  if (points.length <= size) return [points];
  const out: Coord[][] = [];
  const step = size - 1;
  for (let i = 0; i < points.length; i += step) {
    out.push(points.slice(i, Math.min(i + size, points.length)));
    if (i + size >= points.length) break;
  }
  return out;
};

const runWithConcurrency = async (
  batches: PoiBatch[],
  limit: number,
): Promise<PromiseSettledResult<RawPlace[]>[]> => {
  const results: PromiseSettledResult<RawPlace[]>[] = [];
  for (let i = 0; i < batches.length; i += limit) {
    const window = batches.slice(i, i + limit);
    const settled = await Promise.allSettled(window.map(cachedBatch));
    results.push(...settled);
  }
  return results;
};

const attractionSamples = (samples: Coord[]): Coord[] =>
  samples.filter(
    (_, index) =>
      index === 0 || index === samples.length - 1 || index % ATTRACTION_SAMPLE_STRIDE === 0,
  );

export const fetchPois = async (samples: Coord[]): Promise<RawPlace[]> => {
  if (samples.length === 0) return [];
  const batches: PoiBatch[] = [
    ...chunkRoute(samples, BUSINESS_BATCH_SIZE).map((points) => ({
      kind: "business" as const,
      points,
    })),
    ...chunkRoute(attractionSamples(samples), ATTRACTION_BATCH_SIZE).map((points) => ({
      kind: "attraction" as const,
      points,
    })),
  ];
  const settled = await runWithConcurrency(batches, PARALLEL);
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
};

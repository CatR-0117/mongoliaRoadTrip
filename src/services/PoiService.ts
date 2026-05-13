import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/Env";
import { safeFetch } from "@/lib/Fetcher";
import { withCache, cacheKey } from "@/lib/ServerCache";
import { osmTagToCategory } from "@/app/(main)/_utils/Categories";
import type { Coord } from "@/types/Route";
import type { PlaceCategory } from "@/types/Place";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RADIUS_METERS = 5000;
const BATCH_SIZE = 8;
const PARALLEL = 3;

export type RawPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  coord: Coord;
};

const nodeSchema = z.object({
  type: z.literal("node"),
  id: z.number(),
  lat: z.number(),
  lon: z.number(),
  tags: z.record(z.string(), z.string()).optional(),
});

const responseSchema = z.object({
  elements: z.array(z.union([nodeSchema, z.object({ type: z.string() }).passthrough()])),
});

const buildQuery = (batch: Coord[]): string => {
  const clauses = batch
    .map(([lon, lat]) => {
      const around = `around:${RADIUS_METERS},${lat.toFixed(5)},${lon.toFixed(5)}`;
      return [
        `  node["amenity"~"^(restaurant|cafe|fuel)$"](${around});`,
        `  node["tourism"~"^(hotel|camp_site|attraction|viewpoint)$"](${around});`,
      ].join("\n");
    })
    .join("\n");
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout tags center;`;
};

const round3 = (n: number): string => n.toFixed(3);

const tagToCategory = (tags: Record<string, string>): PlaceCategory | null => {
  if (tags.amenity) return osmTagToCategory("amenity", tags.amenity);
  if (tags.tourism) return osmTagToCategory("tourism", tags.tourism);
  return null;
};

const elementToRawPlace = (el: unknown): RawPlace | null => {
  const parsed = nodeSchema.safeParse(el);
  if (!parsed.success) return null;
  const tags = parsed.data.tags ?? {};
  const name = tags.name;
  if (!name) return null;
  const category = tagToCategory(tags);
  if (!category) return null;
  return {
    id: `node/${parsed.data.id}`,
    name,
    category,
    coord: [parsed.data.lon, parsed.data.lat],
  };
};

const callOverpass = async (batch: Coord[]): Promise<RawPlace[]> => {
  const env = getServerEnv();
  const body = `data=${encodeURIComponent(buildQuery(batch))}`;
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

const cachedBatch = (batch: Coord[]): Promise<RawPlace[]> => {
  const key = batch.map(([lon, lat]) => `${round3(lon)},${round3(lat)}`).join("|");
  return withCache(() => callOverpass(batch), {
    keyParts: ["poi", cacheKey(key)],
    revalidateSeconds: 12 * 60 * 60,
    tags: ["poi"],
  })();
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

const runWithConcurrency = async (
  batches: Coord[][],
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

export const fetchPois = async (samples: Coord[]): Promise<RawPlace[]> => {
  if (samples.length === 0) return [];
  const batches = chunk(samples, BATCH_SIZE);
  const settled = await runWithConcurrency(batches, PARALLEL);
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
};

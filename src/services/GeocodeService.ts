import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/Env";
import { safeFetch } from "@/lib/Fetcher";
import { withCache, cacheKey } from "@/lib/ServerCache";
import type { Coord, RoutePoint } from "@/types/Route";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

const responseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    name: z.string().optional(),
  }),
);

const reverseSchema = z.object({
  lat: z.string(),
  lon: z.string(),
  display_name: z.string(),
  name: z.string().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      county: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

const callNominatim = async (query: string, userAgent: string): Promise<RoutePoint> => {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&countrycodes=mn&limit=1`;
  const res = await safeFetch({
    url,
    init: {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      cache: "no-store",
    },
    timeoutMs: 10_000,
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = responseSchema.parse(await res.json());
  const hit = data[0];
  if (!hit) throw new Error(`No location found for "${query}"`);
  const coord: Coord = [Number(hit.lon), Number(hit.lat)];
  return { name: hit.name ?? query, displayName: hit.display_name, coord };
};

export const geocode = async (query: string): Promise<RoutePoint> => {
  const env = getServerEnv();
  const normalized = query.trim().toLowerCase();
  const loader = withCache(() => callNominatim(query.trim(), env.NOMINATIM_USER_AGENT), {
    keyParts: ["geocode", cacheKey(normalized)],
    revalidateSeconds: 60 * 60,
    tags: ["geocode"],
  });
  return loader();
};

const pickReverseName = (parsed: z.infer<typeof reverseSchema>): string => {
  const a = parsed.address;
  if (a?.city) return a.city;
  if (a?.town) return a.town;
  if (a?.village) return a.village;
  if (a?.county) return a.county;
  if (a?.state) return a.state;
  return parsed.name ?? parsed.display_name.split(",")[0] ?? "My location";
};

const callReverse = async (
  lat: number,
  lon: number,
  userAgent: string,
): Promise<RoutePoint> => {
  const url = `${NOMINATIM_REVERSE_URL}?lat=${lat}&lon=${lon}&format=json&zoom=12`;
  const res = await safeFetch({
    url,
    init: {
      headers: { "User-Agent": userAgent, Accept: "application/json" },
      cache: "no-store",
    },
    timeoutMs: 10_000,
  });
  if (!res.ok) throw new Error(`Nominatim reverse ${res.status}`);
  const parsed = reverseSchema.parse(await res.json());
  const coord: Coord = [Number(parsed.lon), Number(parsed.lat)];
  return { name: pickReverseName(parsed), displayName: parsed.display_name, coord };
};

export const reverseGeocode = async (lat: number, lon: number): Promise<RoutePoint> => {
  const env = getServerEnv();
  const loader = withCache(() => callReverse(lat, lon, env.NOMINATIM_USER_AGENT), {
    keyParts: ["reverse", cacheKey(lat.toFixed(3), lon.toFixed(3))],
    revalidateSeconds: 60 * 60,
    tags: ["reverse"],
  });
  return loader();
};

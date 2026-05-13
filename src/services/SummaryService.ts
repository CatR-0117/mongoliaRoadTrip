import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/lib/Env";
import { withCache, cacheKey } from "@/lib/ServerCache";
import { CATEGORY_SPECS } from "@/app/(main)/_utils/Categories";
import type { Place } from "@/types/Place";
import type { RouteResult } from "@/types/Route";

const MODEL = "gemini-2.0-flash";

const formatKm = (m: number): string => `${(m / 1000).toFixed(0)} km`;
const formatHours = (s: number): string => `${(s / 3600).toFixed(1)} h`;

const summarizeCounts = (places: Place[]): string => {
  const lines = CATEGORY_SPECS.map((spec) => {
    const count = places.filter((p) => p.category === spec.id).length;
    return count > 0 ? `${spec.label}: ${count}` : null;
  }).filter((s): s is string => s !== null);
  return lines.join(", ");
};

const buildPrompt = (route: RouteResult, places: Place[]): string => {
  const counts = summarizeCounts(places);
  return [
    `Write a friendly, useful 3-sentence overview for a Mongolia road trip.`,
    `Route: ${route.from.name} → ${route.to.name}.`,
    `Distance: ${formatKm(route.distanceMeters)}, driving time ${formatHours(route.durationSeconds)}.`,
    `Stops available along the way: ${counts}.`,
    `Suggest one practical fuel/rest tip and one cultural or scenic highlight if possible. No emoji. Keep it under 80 words.`,
  ].join(" ");
};

const callGemini = async (prompt: string, apiKey: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
  const text = response.text;
  if (!text) throw new Error("Gemini returned no text");
  return text.trim();
};

export const generateTripSummary = async (
  route: RouteResult,
  places: Place[],
): Promise<string> => {
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const prompt = buildPrompt(route, places);
  const key = cacheKey(
    "summary",
    route.from.name,
    route.to.name,
    Math.round(route.distanceMeters / 1000),
    places.length,
  );
  return withCache(() => callGemini(prompt, env.GEMINI_API_KEY as string), {
    keyParts: [key],
    revalidateSeconds: 24 * 60 * 60,
    tags: ["summary"],
  })();
};

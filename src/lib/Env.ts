import "server-only";
import { z } from "zod";

const schema = z.object({
  ORS_API_KEY: z.string().min(10, "ORS_API_KEY is missing"),
  NOMINATIM_USER_AGENT: z.string().min(5, "NOMINATIM_USER_AGENT is missing"),
  GEMINI_API_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  if (cached) return cached;
  cached = schema.parse({
    ORS_API_KEY: process.env.ORS_API_KEY,
    NOMINATIM_USER_AGENT: process.env.NOMINATIM_USER_AGENT,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
  return cached;
};

export const hasGemini = (): boolean => Boolean(getServerEnv().GEMINI_API_KEY);

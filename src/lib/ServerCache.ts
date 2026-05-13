import "server-only";
import { unstable_cache } from "next/cache";

type Loader<T> = () => Promise<T>;

type CacheOptions = {
  keyParts: string[];
  revalidateSeconds: number;
  tags?: string[];
};

export const withCache = <T>(loader: Loader<T>, opts: CacheOptions): Loader<T> =>
  unstable_cache(loader, opts.keyParts, {
    revalidate: opts.revalidateSeconds,
    tags: opts.tags,
  });

export const cacheKey = (...parts: (string | number)[]): string =>
  parts.map((p) => String(p)).join(":");

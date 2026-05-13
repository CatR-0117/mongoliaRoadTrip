import "server-only";

type FetchInput = {
  url: string;
  init?: RequestInit;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT = 25_000;

const runOnce = async (input: FetchInput): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT);
  try {
    return await fetch(input.url, { ...input.init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const safeFetch = async (input: FetchInput): Promise<Response> => {
  const retries = input.retries ?? 1;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await runOnce(input);
      if (res.ok) return res;
      if (res.status >= 500) {
        lastErr = new Error(`Upstream ${res.status} ${res.statusText}`);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Unknown fetch error");
};

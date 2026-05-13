"use client";

import { useCallback, useState } from "react";
import type { RoutePoint } from "@/types/Route";

export type GeolocationStatus = "idle" | "requesting" | "ready" | "denied" | "unsupported" | "error";

export type GeolocationState = {
  status: GeolocationStatus;
  point: RoutePoint | null;
  error: string | null;
  request: () => void;
};

const fetchReverse = async (lat: number, lon: number): Promise<RoutePoint> => {
  const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return (await res.json()) as RoutePoint;
};

const isDeniedError = (err: GeolocationPositionError): boolean =>
  err.code === err.PERMISSION_DENIED;

export const useGeolocation = (): GeolocationState => {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [point, setPoint] = useState<RoutePoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setError("Geolocation is not supported in this browser");
      return;
    }
    setStatus("requesting");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resolved = await fetchReverse(pos.coords.latitude, pos.coords.longitude);
          setPoint(resolved);
          setStatus("ready");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not resolve your location");
          setStatus("error");
        }
      },
      (err) => {
        setStatus(isDeniedError(err) ? "denied" : "error");
        setError(err.message);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  return { status, point, error, request };
};

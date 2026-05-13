"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/Cn";
import type { GeolocationState } from "@/app/(main)/_features/UseGeolocation";

type RouteSearchFormProps = {
  initialFrom?: string;
  initialTo?: string;
  isLoading: boolean;
  geolocation: GeolocationState;
  onSubmit: (from: string, to: string) => void;
};

const FIELD_BASE =
  "flex flex-1 items-center px-4 py-3 md:py-0 md:h-14 border-b md:border-b-0 md:border-r border-border last:border-none";

const locationHintFor = (status: GeolocationState["status"]): string => {
  if (status === "requesting") return "Getting your location…";
  if (status === "denied") return "Permission denied";
  if (status === "unsupported") return "Not supported";
  if (status === "error") return "Couldn't locate";
  return "Use my location";
};

export const RouteSearchForm = ({
  initialFrom = "",
  initialTo = "",
  isLoading,
  geolocation,
  onSubmit,
}: RouteSearchFormProps) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [lastGeoName, setLastGeoName] = useState<string | null>(null);
  const geoName =
    geolocation.status === "ready" && geolocation.point ? geolocation.point.name : null;
  if (geoName !== lastGeoName) {
    setLastGeoName(geoName);
    if (geoName && from === "") setFrom(geoName);
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!from.trim() || !to.trim() || isLoading) return;
    onSubmit(from.trim(), to.trim());
  };

  return (
    <div className="w-full max-w-[760px] mt-8 flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2"
      >
        <div className={FIELD_BASE}>
          <Icon name="my_location" className="text-muted mr-3" />
          <Input
            value={from}
            onChange={(e) => setFrom(e.currentTarget.value)}
            placeholder="From (e.g. Ulaanbaatar)"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className={FIELD_BASE}>
          <Icon name="flag" className="text-muted mr-3" />
          <Input
            value={to}
            onChange={(e) => setTo(e.currentTarget.value)}
            placeholder="To (e.g. Khuvsgul)"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <Button type="submit" size="lg" disabled={isLoading} className="md:w-auto">
          <Icon
            name={isLoading ? "progress_activity" : "search"}
            className={cn(isLoading && "animate-spin")}
          />
          <span>{isLoading ? "Planning" : "Plan route"}</span>
        </Button>
      </form>
      <button
        type="button"
        onClick={geolocation.request}
        disabled={geolocation.status === "requesting"}
        className="self-start inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 transition-colors disabled:opacity-60"
      >
        <Icon
          name={geolocation.status === "requesting" ? "progress_activity" : "near_me"}
          className={cn("text-base", geolocation.status === "requesting" && "animate-spin")}
        />
        <span>{locationHintFor(geolocation.status)}</span>
      </button>
    </div>
  );
};

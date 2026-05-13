import { Icon } from "@/components/ui/Icon";
import type { RouteResult } from "@/types/Route";

type RouteHeaderProps = {
  route: RouteResult;
  placeCount: number;
};

const formatKm = (m: number): string => `${(m / 1000).toFixed(0)} km`;

const formatDuration = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
};

const Endpoint = ({ icon, label, sub }: { icon: string; label: string; sub: string }) => (
  <div className="flex items-center gap-3 min-w-0">
    <div className="size-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
      <Icon name={icon} className="text-[20px]" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">{sub}</p>
      <p className="text-base md:text-lg font-extrabold text-foreground truncate">{label}</p>
    </div>
  </div>
);

const Connector = ({ distance, duration }: { distance: string; duration: string }) => (
  <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-[100px]">
    <div className="size-2 rounded-full bg-primary shrink-0" />
    <div className="flex-1 h-px bg-primary/40 relative">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
        <div className="flex items-center gap-2 bg-white border border-border rounded-full px-3 py-1 shadow-sm whitespace-nowrap">
          <Icon name="straighten" className="text-primary text-[14px]" />
          <span className="text-[11px] font-extrabold text-foreground tabular-nums">{distance}</span>
          <span className="text-muted">·</span>
          <Icon name="schedule" className="text-primary text-[14px]" />
          <span className="text-[11px] font-extrabold text-foreground tabular-nums">{duration}</span>
        </div>
      </div>
    </div>
    <div className="size-2 rounded-full bg-primary shrink-0" />
  </div>
);

export const RouteHeader = ({ route, placeCount }: RouteHeaderProps) => (
  <section className="bg-white border border-border rounded-2xl p-4 md:p-6 shadow-sm">
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6">
      <Endpoint icon="trip_origin" label={route.from.name} sub="Start" />
      <Connector
        distance={formatKm(route.distanceMeters)}
        duration={formatDuration(route.durationSeconds)}
      />
      <Endpoint icon="flag" label={route.to.name} sub="Destination" />
    </div>
    <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-4 text-xs text-muted font-semibold">
      <span className="flex items-center gap-1">
        <Icon name="place" className="text-primary text-base" />
        {placeCount} places along route
      </span>
      <span className="flex items-center gap-1">
        <Icon name="explore" className="text-primary text-base" />
        Sampled every 15 km, 5 km corridor
      </span>
    </div>
  </section>
);

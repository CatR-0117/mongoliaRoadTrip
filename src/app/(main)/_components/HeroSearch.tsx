import { RouteSearchForm } from "@/app/(main)/_components/RouteSearchForm";
import type { GeolocationState } from "@/app/(main)/_features/UseGeolocation";

type HeroSearchProps = {
  isLoading: boolean;
  geolocation: GeolocationState;
  onSubmit: (from: string, to: string) => void;
  initialFrom?: string;
  initialTo?: string;
};

const HERO_BG =
  "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=1800&q=80";

export const HeroSearch = ({
  isLoading,
  geolocation,
  onSubmit,
  initialFrom,
  initialTo,
}: HeroSearchProps) => (
  <div className="w-full max-w-[1200px] px-4 md:px-10 py-6 md:py-8">
    <div
      className="flex min-h-[460px] md:min-h-[520px] flex-col gap-6 bg-cover bg-center rounded-3xl items-center justify-center p-6 md:p-10 shadow-2xl relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(13,20,27,0.35) 0%, rgba(13,20,27,0.65) 100%), url("${HERO_BG}")`,
      }}
    >
      <div className="flex flex-col gap-3 text-center z-10 max-w-[760px]">
        <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-[-0.025em] drop-shadow-lg">
          Plan your Mongolia road trip
        </h1>
        <p className="text-white/90 text-base md:text-lg font-medium drop-shadow-md">
          Find fuel, food, camps and scenic stops along any route across the steppe.
        </p>
      </div>
      <RouteSearchForm
        isLoading={isLoading}
        geolocation={geolocation}
        onSubmit={onSubmit}
        initialFrom={initialFrom}
        initialTo={initialTo}
      />
    </div>
  </div>
);

import { Icon } from "@/components/ui/Icon";

export const SiteHeader = () => (
  <div className="w-full flex justify-center border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-40">
    <header className="flex w-full max-w-[1200px] items-center justify-between px-4 md:px-10 py-3">
      <div className="flex items-center gap-3 text-primary">
        <div className="size-9 rounded-lg bg-primary-soft flex items-center justify-center">
          <Icon name="explore" className="text-[22px]" />
        </div>
        <h2 className="text-foreground text-lg md:text-xl font-extrabold leading-tight tracking-tight">
          Mongolia Road Trip
        </h2>
      </div>
      <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-foreground">
        <span className="hover:text-primary transition-colors cursor-default">Routes</span>
        <span className="hover:text-primary transition-colors cursor-default">Camps</span>
        <span className="hover:text-primary transition-colors cursor-default">Guides</span>
      </nav>
      <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted">
        <Icon name="public" className="text-base" />
        <span>Free POIs from OpenStreetMap</span>
      </div>
    </header>
  </div>
);

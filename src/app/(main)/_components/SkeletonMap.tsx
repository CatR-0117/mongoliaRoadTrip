import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";

export const SkeletonMap = () => (
  <div className="relative w-full h-[480px] md:h-[560px] rounded-2xl overflow-hidden border border-border bg-white">
    <Skeleton className="absolute inset-0 rounded-2xl" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="bg-white px-4 py-3 rounded-xl shadow-md flex items-center gap-2 border border-border">
        <Icon name="progress_activity" className="text-primary animate-spin" />
        <span className="text-sm font-semibold text-foreground">Plotting your route…</span>
      </div>
    </div>
  </div>
);

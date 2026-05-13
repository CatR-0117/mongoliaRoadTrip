"use client";

import { useSummaryQuery } from "@/app/(main)/_features/UseSummaryQuery";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Place } from "@/types/Place";
import type { RouteResult } from "@/types/Route";

type TripSummaryProps = {
  route: RouteResult;
  places: Place[];
};

const LoadingState = () => (
  <div className="space-y-2">
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-[92%]" />
    <Skeleton className="h-3 w-[78%]" />
  </div>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <section className="bg-gradient-to-br from-primary/8 via-white to-white border border-primary/20 rounded-2xl p-5 md:p-6 shadow-sm">
    <header className="flex items-center gap-3 mb-3">
      <div className="size-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30">
        <Icon name="auto_awesome" className="text-[18px]" />
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
          AI trip overview
        </p>
        <h3 className="text-base font-extrabold text-foreground">Powered by Gemini</h3>
      </div>
    </header>
    {children}
  </section>
);

const Disabled = () => (
  <div className="text-sm text-muted">
    Set <code className="font-mono text-foreground">GEMINI_API_KEY</code> in{" "}
    <code className="font-mono text-foreground">.env.local</code> to enable AI overviews. Free
    keys at{" "}
    <a
      className="text-primary underline"
      target="_blank"
      rel="noreferrer"
      href="https://aistudio.google.com/apikey"
    >
      aistudio.google.com/apikey
    </a>
    .
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="text-sm text-muted">
    Couldn&apos;t generate an overview right now. <span className="text-foreground/70">{message}</span>
  </div>
);

export const TripSummary = ({ route, places }: TripSummaryProps) => {
  const query = useSummaryQuery(route, places);

  if (query.isLoading) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }
  if (query.error) {
    return (
      <Shell>
        <ErrorState message={query.error.message} />
      </Shell>
    );
  }
  if (!query.data || query.data.enabled === false) {
    return (
      <Shell>
        <Disabled />
      </Shell>
    );
  }
  return (
    <Shell>
      <p className="text-sm md:text-base leading-relaxed text-foreground whitespace-pre-line">
        {query.data.summary}
      </p>
    </Shell>
  );
};

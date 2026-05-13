"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

type QueryProviderProps = { children: ReactNode };

const buildClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

export const QueryProvider = ({ children }: QueryProviderProps) => {
  const [client] = useState(buildClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

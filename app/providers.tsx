"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChunkLoadRecovery } from "@/components/layout/ChunkLoadRecovery";
import { ClientRootErrorBoundary } from "@/components/layout/ClientRootErrorBoundary";
import { AppToaster } from "@/components/ui/AppToaster";
import { StyledComponentsRegistry } from "@/styles/registry";
import { ThemeHydration } from "@/app/theme-hydration";
import { PomodoroManager } from "@/components/features/pomodoro/PomodoroManager";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ClientRootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StyledComponentsRegistry>
          <ChunkLoadRecovery />
          <ThemeHydration />
          <PomodoroManager />
          {children}
          <AppToaster />
        </StyledComponentsRegistry>
      </QueryClientProvider>
    </ClientRootErrorBoundary>
  );
}

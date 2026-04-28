'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthBootstrap } from '@/shared/guards/AuthBootstrap';

/**
 * Root client-side providers.
 *
 * - QueryClientProvider:   server-state cache for react-query.
 * - ReactQueryDevtools:    dev-only floating panel.
 * - AuthBootstrap:         hydrates auth on first paint via /api/auth/me.
 *
 * `useState(() => new QueryClient(...))` ensures a single client instance
 * across re-renders without leaking across requests during SSR (Next 16
 * RSC-friendly pattern).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status =
                typeof error === 'object' && error !== null && 'status' in error
                  ? (error as { status?: number }).status
                  : undefined;
              if (status === 401 || status === 403 || status === 404) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthBootstrap />
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

'use client';

import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Spinner } from '@/shared/components/Spinner';
import { useTestApiHealth } from '@/features/dashboard/hooks/useTestApiHealth';

/**
 * Demo panel that exercises the full data path:
 *   browser -> axios http (Bearer + single-flight refresh)
 *           -> /api/test/health  (BFF catch-all proxy)
 *           -> test_api          (verifies JWT via JWKS, returns health)
 *
 * If test_api is offline, the BFF returns 502 and we render a clear error.
 */
export function HealthPanel() {
  const { data, error, isPending, isFetching, refetch } = useTestApiHealth();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            test_api health
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <code className="font-mono">GET /api/test/health</code> — round-trip via the BFF proxy.
          </p>
        </div>
        <Button variant="secondary" size="sm" isLoading={isFetching} onClick={() => refetch()}>
          Refresh
        </Button>
      </header>

      {isPending ? (
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner /> Calling test_api…
        </div>
      ) : error ? (
        <Alert tone="error" title="Could not reach test_api">
          {error instanceof Error ? error.message : 'Unknown error.'}
        </Alert>
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-4 text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}

'use client';

import { useEffect } from 'react';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';

/**
 * Route-level error boundary for the (auth) and root segments.
 *
 * Next.js renders this when a render or data-fetch error escapes a child
 * server/client component within the same segment tree. `<RootLayout />` is
 * still rendered above this — only `children` is replaced — so the user
 * keeps the global chrome (fonts, providers, toast portal).
 *
 * `reset()` re-renders the segment, which is enough for transient faults.
 * For hard failures we send the user back to /.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Alert tone="error" title="Something went wrong">
          {error.message || 'Unexpected error.'}
          {error.digest && (
            <span className="mt-1 block font-mono text-xs opacity-60">ref: {error.digest}</span>
          )}
        </Alert>
        <div className="flex gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.assign('/');
            }}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

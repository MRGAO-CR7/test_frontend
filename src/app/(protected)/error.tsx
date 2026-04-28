'use client';

import { useEffect } from 'react';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';

/**
 * Error boundary for the (protected) route group.
 *
 * Lives below RootLayout > Providers > AuthGuard, so the user is still
 * authenticated when this renders. The shared <TopBar /> is part of the
 * same layout and stays mounted, so the user can still log out.
 */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[protected-error]', error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <Alert tone="error" title="This page failed to render">
        {error.message || 'Unexpected error.'}
        {error.digest && (
          <span className="mt-1 block font-mono text-xs opacity-60">ref: {error.digest}</span>
        )}
      </Alert>
      <div>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}

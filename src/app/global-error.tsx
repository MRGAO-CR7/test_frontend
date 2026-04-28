'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary. Triggered when an error escapes the root layout
 * itself (e.g. a crash in <Providers>). Because the layout never rendered,
 * we MUST emit our own <html>/<body> here.
 *
 * Keep this file dependency-free — Tailwind utility classes won't apply
 * either, since the RootLayout that imports `globals.css` did not run.
 * Use inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error-boundary]', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#0b0b0c',
          color: '#e5e7eb',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%' }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Application error</h1>
          <p style={{ fontSize: 14, opacity: 0.8, margin: '0 0 12px' }}>
            {error.message || 'An unexpected error has occurred.'}
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, opacity: 0.5 }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #3f3f46',
              background: '#18181b',
              color: '#fafafa',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

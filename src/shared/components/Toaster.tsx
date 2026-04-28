'use client';

import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
import { useToastStore, type ToastItem, type ToastTone } from '@/shared/store/toastStore';

/**
 * Bottom-right notification stack. Mounted once at the root inside
 * <Providers>. Each item is rendered through ToastCard; the card schedules
 * its own auto-dismiss timer.
 *
 * Accessibility:
 *   - region with `aria-live="polite"` so screen readers announce additions
 *     without stealing focus.
 *   - `role="alert"` on error toasts so they're announced more aggressively.
 */

const TONE_STYLES: Record<ToastTone, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-100',
  error:
    'border-red-200 bg-red-50 text-red-900 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-100',
  info: 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
};

const TONE_ICON: Record<ToastTone, string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

const TONE_ICON_BG: Record<ToastTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  error: 'bg-red-500/15 text-red-700 dark:text-red-300',
  info: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
};

function ToastCard({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!item.duration || item.duration <= 0) return;
    const handle = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(handle);
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      role={item.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 shadow-lg shadow-zinc-900/5 backdrop-blur transition-all duration-200',
        TONE_STYLES[item.tone],
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          TONE_ICON_BG[item.tone],
        )}
      >
        {TONE_ICON[item.tone]}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium leading-5">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-xs leading-4 opacity-80">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Dismiss notification"
        className="-mr-1 rounded p-0.5 text-current/60 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
      >
        <span aria-hidden className="block h-3 w-3 leading-3">
          ×
        </span>
      </button>
    </div>
  );
}

export function Toaster() {
  const items = useToastStore((s) => s.items);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 px-4 pb-4 sm:inset-x-auto sm:right-4 sm:max-w-sm"
    >
      {items.map((it) => (
        <ToastCard key={it.id} item={it} />
      ))}
    </div>
  );
}

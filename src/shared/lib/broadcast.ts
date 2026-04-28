import type { AuthUser } from '@/types/auth';

/**
 * Multi-tab auth state synchronization.
 *
 * Every tab subscribes to a single `BroadcastChannel('auth')`. When tab A
 * logs in, refreshes, or logs out, tab B receives the same event and updates
 * its in-memory zustand state without re-asking the BFF.
 *
 * This file is browser-only. On the server (Node) `BroadcastChannel` from
 * the `worker_threads` module exists but has different semantics; we guard
 * with `typeof window` so importing this from a server file is safe.
 */

const CHANNEL_NAME = 'auth';

export type AuthBroadcastEvent =
  | { type: 'login'; accessToken: string; expiresAt: number; user: AuthUser }
  | { type: 'refreshed'; accessToken: string; expiresAt: number; user: AuthUser }
  | { type: 'logout' };

let channel: BroadcastChannel | null = null;
let initialized = false;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!initialized) {
    initialized = true;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

export function publishAuth(event: AuthBroadcastEvent): void {
  const ch = getChannel();
  if (!ch) return;
  try {
    ch.postMessage(event);
  } catch {
    // Cloning errors silently swallowed — broadcast is best-effort.
  }
}

export function subscribeAuth(handler: (event: AuthBroadcastEvent) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (e: MessageEvent<AuthBroadcastEvent>) => {
    if (!e.data || typeof e.data !== 'object') return;
    handler(e.data);
  };

  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}

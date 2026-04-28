'use client';

import { useEffect, useRef } from 'react';
import { bootstrapSession } from '@/shared/api/http';
import { authStore, useAuthStore } from '@/features/auth/store/authStore';
import { publishAuth, subscribeAuth } from '@/shared/lib/broadcast';

/**
 * Mounted once at the root layout. On first paint:
 *
 *  1. Calls GET /api/auth/me. If a refresh cookie exists the BFF rotates it
 *     and returns a fresh access_token + user — we hydrate the store.
 *  2. If 401 we mark the store as unauthenticated; protected routes will
 *     redirect to /login.
 *
 * Also wires the BroadcastChannel listener so that login/logout in any tab
 * propagates to every other open tab in the same origin.
 *
 * Renders nothing; behaviour-only component.
 */
export function AuthBootstrap() {
  const ranRef = useRef(false);
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const session = await bootstrapSession();
        if (cancelled) return;
        if (session) {
          authStore.setSession(session);
          publishAuth({
            type: 'refreshed',
            accessToken: session.access_token,
            expiresAt: session.expires_at,
            user: session.user,
          });
        } else {
          authStore.clear();
        }
      } catch {
        if (!cancelled) authStore.clear();
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setBootstrapping]);

  // Subscribe to cross-tab events.
  useEffect(() => {
    return subscribeAuth((event) => {
      switch (event.type) {
        case 'login':
        case 'refreshed':
          authStore.setSession({
            access_token: event.accessToken,
            expires_in: Math.max(1, Math.floor((event.expiresAt - Date.now()) / 1000)),
            expires_at: event.expiresAt,
            user: event.user,
          });
          break;
        case 'logout':
          authStore.clear();
          break;
      }
    });
  }, []);

  return null;
}

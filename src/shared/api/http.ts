import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { authStore } from '@/features/auth/store/authStore';
import { publishAuth } from '@/shared/lib/broadcast';
import type { BffSession } from '@/types/auth';

/**
 * Browser-side HTTP client.
 *
 * Two responsibilities:
 *
 * 1. Inject the in-memory access_token as `Authorization: Bearer ...` on every
 *    outbound request. If the token is within `PROACTIVE_REFRESH_LEAD_MS` of
 *    expiring, refresh BEFORE the request flies — single-flight.
 *
 * 2. On 401, attempt one refresh, then replay the original request — also
 *    single-flight so N concurrent 401s share one refresh round-trip.
 *
 * Hard rules:
 *   - The refresh call uses bare `fetch`, NEVER `http`, to avoid recursion.
 *   - `_retried` flag prevents infinite loops if the replay also returns 401.
 *   - On terminal failure (refresh 401/expired) we clear store, broadcast
 *     `logout`, and bounce the user to /login.
 */

const REFRESH_URL = '/api/auth/refresh';
const PROACTIVE_REFRESH_LEAD_MS = 60_000;

interface InternalConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
  _skipAuth?: boolean;
}

export interface AuthAwareRequestConfig extends AxiosRequestConfig {
  _skipAuth?: boolean;
}

export const http = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// ─── single-flight refresh ───────────────────────────────────────────────
let inflightRefresh: Promise<string> | null = null;

async function callRefresh(): Promise<BffSession> {
  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RefreshFailedError(res.status, body);
  }
  return (await res.json()) as BffSession;
}

async function refreshOnce(): Promise<string> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const session = await callRefresh();
      authStore.setSession(session);
      publishAuth({
        type: 'refreshed',
        accessToken: session.access_token,
        expiresAt: session.expires_at,
        user: session.user,
      });
      return session.access_token;
    } catch (err) {
      authStore.clear();
      publishAuth({ type: 'logout' });
      throw err;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

export class RefreshFailedError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`refresh_failed_${status}`);
    this.name = 'RefreshFailedError';
  }
}

// ─── interceptors ────────────────────────────────────────────────────────
http.interceptors.request.use(async (config) => {
  const cfg = config as InternalConfig;
  if (cfg._skipAuth) return cfg;

  const { accessToken, expiresAt } = authStore.state;

  // Proactive refresh: about to expire? renew first, attach new token.
  if (accessToken && expiresAt !== null && Date.now() > expiresAt - PROACTIVE_REFRESH_LEAD_MS) {
    try {
      const fresh = await refreshOnce();
      cfg.headers.set('Authorization', `Bearer ${fresh}`);
      return cfg;
    } catch {
      // Fall through; reactive 401 path below will handle redirect-to-login.
    }
  }

  if (accessToken) {
    cfg.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return cfg;
});

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as InternalConfig | undefined;
    const status = error.response?.status;

    if (!cfg || status !== 401 || cfg._retried || cfg._skipAuth) {
      return Promise.reject(error);
    }

    cfg._retried = true;

    try {
      const fresh = await refreshOnce();
      cfg.headers.set('Authorization', `Bearer ${fresh}`);
      return http(cfg);
    } catch (refreshErr) {
      if (typeof window !== 'undefined') {
        // Avoid bouncing during /api/auth/* calls themselves.
        const path = window.location.pathname;
        if (!path.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
      return Promise.reject(refreshErr instanceof Error ? refreshErr : error);
    }
  },
);

/**
 * Public utility for the boot phase — used by `<AuthBootstrap />` to perform
 * the initial /api/auth/me call without going through the interceptor (we
 * have no access_token yet). Returns null if no valid session exists.
 */
export async function bootstrapSession(): Promise<BffSession | null> {
  const res = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return (await res.json()) as BffSession;
}

import 'server-only';
import { cookies } from 'next/headers';
import { serverEnv } from '@/shared/config/env';

/**
 * Refresh-token cookie helpers for the BFF.
 *
 * Cookie design:
 *   - HttpOnly:   JS in the browser can never read it (XSS protection)
 *   - Secure:     dev=false, prod=true (no HTTPS in dev)
 *   - SameSite=Strict: only sent for same-site requests; CSRF protection
 *   - Path=/api/auth: only sent to BFF auth routes; never to /api/test/*
 *   - 30 days:    matches typical Entra refresh-token lifetime
 *
 * Rotation: every successful /api/auth/refresh overwrites this cookie with
 * the new refresh_token returned by Entra.
 */

const COOKIE_PATH = '/api/auth';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function setRefreshCookie(refreshToken: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: serverEnv.AUTH_REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: serverEnv.AUTH_COOKIE_SECURE,
    sameSite: 'strict',
    path: COOKIE_PATH,
    domain: serverEnv.AUTH_COOKIE_DOMAIN,
    maxAge: MAX_AGE_SECONDS,
    priority: 'high',
  });
}

export async function getRefreshCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(serverEnv.AUTH_REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function clearRefreshCookie(): Promise<void> {
  const store = await cookies();
  // Re-set with empty value + maxAge=0 so the browser drops it. Using
  // `delete` alone can leave the cookie alive in some edge proxies because
  // Path/Domain must match the original Set-Cookie exactly.
  store.set({
    name: serverEnv.AUTH_REFRESH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: serverEnv.AUTH_COOKIE_SECURE,
    sameSite: 'strict',
    path: COOKIE_PATH,
    domain: serverEnv.AUTH_COOKIE_DOMAIN,
    maxAge: 0,
  });
}

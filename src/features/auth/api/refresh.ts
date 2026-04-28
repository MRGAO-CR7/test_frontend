import 'server-only';
import { NextResponse } from 'next/server';
import { authServiceUrl, upstreamFetch } from '@/shared/api/server-http';
import { clearRefreshCookie, getRefreshCookie, setRefreshCookie } from '@/shared/lib/cookies';
import { errorResponse, extractSession } from '@/features/auth/api/server';
import type { BffSession, UpstreamAuthSuccess } from '@/types/auth';

/**
 * Internal helper used by both /api/auth/refresh and /api/auth/me.
 *
 *   - Reads the HttpOnly refresh cookie.
 *   - Calls auth_service /auth/refresh.
 *   - Rotates the cookie with the new refresh_token (Entra always issues one).
 *   - On any failure, clears the cookie so the SPA stops retrying.
 */
export async function refreshAndRotate(): Promise<
  { ok: true; session: BffSession } | { ok: false; response: NextResponse }
> {
  const refreshToken = await getRefreshCookie();
  if (!refreshToken) {
    return {
      ok: false,
      response: errorResponse({
        code: 'no_refresh_token',
        message: 'No active session.',
        status: 401,
      }),
    };
  }

  const upstream = await upstreamFetch<UpstreamAuthSuccess>(authServiceUrl('/auth/refresh'), {
    method: 'POST',
    json: { refresh_token: refreshToken },
  });

  if (!upstream.ok) {
    // Refresh failed -> token is dead; drop the cookie so we don't loop.
    await clearRefreshCookie();
    return {
      ok: false,
      response: errorResponse({
        ...upstream.error,
        // Always tell the SPA "your session is gone", regardless of what
        // upstream said, so it can route the user to /login.
        status:
          upstream.error.status >= 400 && upstream.error.status < 500 ? 401 : upstream.error.status,
      }),
    };
  }

  // Rotate the cookie. Entra returns a new refresh_token on every /refresh;
  // if upstream omitted it (shouldn't happen) we keep the old one.
  const newRefresh = upstream.data.tokens.refresh_token;
  if (newRefresh) {
    await setRefreshCookie(newRefresh);
  }

  return { ok: true, session: extractSession(upstream.data) };
}

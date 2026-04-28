import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side router for the application root.
 *
 * Without this proxy, hitting `/` would render an empty placeholder while the
 * client bootstraps and only then redirect — a noticeable flash of empty UI.
 *
 * Strategy: peek at the refresh cookie (presence only, never the value).
 *   - cookie present  -> /dashboard (the SPA will validate it via /api/auth/me)
 *   - cookie absent   -> /login
 *
 * Note: the cookie is HttpOnly; only the server (this proxy and BFF route
 * handlers) can read it.
 */
const COOKIE_NAME = process.env.AUTH_REFRESH_COOKIE_NAME ?? 'rt';

export const config = {
  matcher: '/',
};

export function proxy(request: NextRequest) {
  const hasRefreshCookie = request.cookies.has(COOKIE_NAME);
  const target = hasRefreshCookie ? '/dashboard' : '/login';
  return NextResponse.redirect(new URL(target, request.url));
}

import { NextResponse } from 'next/server';
import { refreshAndRotate } from '@/features/auth/api/refresh';

export const runtime = 'nodejs';

/**
 * GET /api/auth/me
 *
 * Bootstrap endpoint called once on app load by `<AuthBootstrap />`.
 *
 *   - Has refresh cookie  -> internally runs refreshAndRotate() and returns a
 *                            fresh BffSession. This is also why hard-reload
 *                            doesn't log the user out.
 *   - No / invalid cookie -> 401 with normalized error body.
 *
 * We deliberately reuse the refresh path rather than introducing a separate
 * "validate" call: it's one less round-trip, and rotating the cookie at boot
 * extends the refresh window every time the user opens the app.
 */
export async function GET() {
  const result = await refreshAndRotate();
  if (!result.ok) return result.response;
  return NextResponse.json(result.session, { status: 200 });
}

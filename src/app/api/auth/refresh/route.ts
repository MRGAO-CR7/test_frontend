import { NextResponse } from 'next/server';
import { refreshAndRotate } from '@/features/auth/api/refresh';

export const runtime = 'nodejs';

/**
 * POST /api/auth/refresh
 *
 * Body is intentionally empty — the refresh_token comes from the HttpOnly
 * cookie. Returns a fresh `BffSession`. The cookie is rotated atomically.
 */
export async function POST() {
  const result = await refreshAndRotate();
  if (!result.ok) return result.response;
  return NextResponse.json(result.session, { status: 200 });
}

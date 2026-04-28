import { NextResponse } from 'next/server';
import { clearRefreshCookie } from '@/shared/lib/cookies';
import type { BffLogoutResult } from '@/types/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 *
 * Idempotent. Always 200 — logging out a logged-out session is fine.
 * auth_service has no /logout endpoint (Entra session lives in tokens, not
 * server-side), so we only need to drop the local cookie. The SPA then
 * clears its in-memory store and broadcasts a logout event to other tabs.
 */
export async function POST() {
  await clearRefreshCookie();
  const body: BffLogoutResult = { ok: true };
  return NextResponse.json(body, { status: 200 });
}

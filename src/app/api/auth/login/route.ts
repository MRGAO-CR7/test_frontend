import { NextResponse } from 'next/server';
import { authServiceUrl, upstreamFetch } from '@/shared/api/server-http';
import { setRefreshCookie } from '@/shared/lib/cookies';
import { errorResponse, extractSession, parseJsonBody } from '@/features/auth/api/server';
import { LoginInputSchema } from '@/features/auth/schemas';
import type { UpstreamAuthSuccess } from '@/types/auth';

export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 *
 *   - Forwards email/password/remember_me to auth_service
 *   - On success and `remember_me=true`, persists the upstream refresh_token
 *     into an HttpOnly cookie scoped to /api/auth.
 *   - Returns the public BffSession (no refresh_token in body, ever).
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, LoginInputSchema);
  if (!parsed.ok) return parsed.response;

  const upstream = await upstreamFetch<UpstreamAuthSuccess>(authServiceUrl('/auth/login'), {
    method: 'POST',
    json: parsed.data,
  });

  if (!upstream.ok) {
    return errorResponse(upstream.error);
  }

  const refreshToken = upstream.data.tokens.refresh_token;
  if (parsed.data.remember_me && refreshToken) {
    await setRefreshCookie(refreshToken);
  }

  const session = extractSession(upstream.data);
  return NextResponse.json(session, { status: 200 });
}

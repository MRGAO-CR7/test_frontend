import { NextResponse } from 'next/server';
import { authServiceUrl, upstreamFetch } from '@/shared/api/server-http';
import { errorResponse, extractSession, parseJsonBody } from '@/features/auth/api/server';
import { VerifyInputSchema } from '@/features/auth/schemas';
import type { UpstreamAuthSuccess } from '@/types/auth';

export const runtime = 'nodejs';

/**
 * Completes signup (OOB code) and returns the BFF session.
 *
 * NOTE: auth_service does not issue a refresh_token on /verify (registration
 * has no `remember_me` semantics), so we DO NOT set the refresh cookie here.
 * The user will need to /login again once the access_token expires (default
 * ~1h). This matches the upstream contract.
 */
export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, VerifyInputSchema);
  if (!parsed.ok) return parsed.response;

  const upstream = await upstreamFetch<UpstreamAuthSuccess>(authServiceUrl('/auth/verify'), {
    method: 'POST',
    json: parsed.data,
  });

  if (!upstream.ok) {
    return errorResponse(upstream.error);
  }

  const session = extractSession(upstream.data);
  return NextResponse.json(session, { status: 200 });
}

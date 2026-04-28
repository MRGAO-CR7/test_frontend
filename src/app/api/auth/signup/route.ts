import { NextResponse } from 'next/server';
import { authServiceUrl, upstreamFetch } from '@/shared/api/server-http';
import { errorResponse, parseJsonBody } from '@/features/auth/api/server';
import { SignupInputSchema } from '@/features/auth/schemas';
import type { BffSignupResult, UpstreamSignupSuccess } from '@/types/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, SignupInputSchema);
  if (!parsed.ok) return parsed.response;

  const upstream = await upstreamFetch<UpstreamSignupSuccess>(authServiceUrl('/auth/signup'), {
    method: 'POST',
    json: parsed.data,
  });

  if (!upstream.ok) {
    return errorResponse(upstream.error);
  }

  const body: BffSignupResult = {
    ok: true,
    email: parsed.data.email,
    challenge_target_label: upstream.data.challenge_target_label,
    code_length: upstream.data.code_length,
    interval: upstream.data.interval,
  };
  return NextResponse.json(body, { status: 200 });
}

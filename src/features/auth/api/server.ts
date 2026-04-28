import 'server-only';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { computeExpiresAtMs, decodeJwtPayload } from '@/shared/lib/jwt';
import type { AuthUser, BffErrorBody, BffSession, UpstreamAuthSuccess } from '@/types/auth';

/**
 * Server-side helpers shared by every /api/auth/* route handler.
 *
 *   - `parseJsonBody`  — read + zod-validate the incoming JSON body
 *   - `extractSession` — turn an UpstreamAuthSuccess into a public BffSession
 *                        (strips refresh_token, maps user_uuid -> user.id,
 *                         falls back to JWT claims if upstream omits user info)
 *   - `errorResponse` / `validationError` — uniform JSON error responses
 */

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse({
        code: 'invalid_json',
        message: 'Request body must be valid JSON.',
        status: 400,
      }),
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: validationError(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

export function validationError(zerr: ZodError): NextResponse {
  const first = zerr.issues[0];
  const path = first?.path.join('.') ?? '';
  return errorResponse({
    code: 'validation_error',
    message: first ? `${path ? `${path}: ` : ''}${first.message}` : 'Invalid request payload.',
    status: 422,
    details: zerr.issues,
  });
}

export function errorResponse(body: Omit<BffErrorBody, 'ok'>): NextResponse {
  const payload: BffErrorBody = { ok: false, ...body };
  return NextResponse.json(payload, { status: body.status });
}

/**
 * Build a `BffSession` from an upstream login/verify/refresh success.
 *
 * Strategy for `user`:
 *   1. Prefer fields explicitly returned by auth_service (user_uuid, email, ...)
 *   2. Fall back to claims decoded from the access_token (oid, email, sub).
 *
 * Falling back from JWT is important on /refresh in pathological cases where
 * upstream omits user info — we still need a stable user object for the SPA.
 */
export function extractSession(upstream: UpstreamAuthSuccess): BffSession {
  const accessToken = upstream.tokens.access_token;
  const expiresIn = upstream.tokens.expires_in ?? 3600;

  const claims = decodeJwtPayload(accessToken) ?? {};
  const claimsRecord = claims as Record<string, unknown>;

  const id =
    upstream.user_uuid ?? pickString(claimsRecord, 'oid') ?? pickString(claimsRecord, 'sub') ?? '';
  const email =
    upstream.email ??
    pickString(claimsRecord, 'email') ??
    pickString(claimsRecord, 'preferred_username') ??
    '';

  const user: AuthUser = {
    id,
    email,
    first_name: upstream.first_name ?? pickString(claimsRecord, 'given_name'),
    last_name: upstream.last_name ?? pickString(claimsRecord, 'family_name'),
  };

  return {
    access_token: accessToken,
    expires_in: expiresIn,
    expires_at: computeExpiresAtMs({ accessToken, expiresIn }),
    user,
  };
}

function pickString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

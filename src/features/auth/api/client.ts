import type { BffErrorBody, BffLogoutResult, BffSession, BffSignupResult } from '@/types/auth';
import type { LoginInput, SignupInput, VerifyInput } from '@/features/auth/schemas';

/**
 * Browser-side fetchers for the BFF /api/auth/* endpoints.
 *
 * Why bare `fetch` instead of the shared axios `http` instance:
 *
 *   - These calls do NOT need an Authorization header — the BFF reads the
 *     refresh cookie itself.
 *   - We must avoid the axios 401 -> refresh interceptor: refresh recursion
 *     would be a footgun on the login/refresh endpoints themselves.
 *
 * All four functions throw `BffApiError` on a non-2xx response so calling
 * code (react-query mutations) can branch on `instanceof BffApiError`.
 */

export class BffApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: BffErrorBody;

  constructor(body: BffErrorBody) {
    super(body.message);
    this.name = 'BffApiError';
    this.status = body.status;
    this.code = body.code;
    this.body = body;
  }
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* allow empty body */
  }

  if (!res.ok) {
    const errBody: BffErrorBody =
      payload && typeof payload === 'object' && 'ok' in (payload as object)
        ? (payload as BffErrorBody)
        : {
            ok: false,
            code: `http_${res.status}`,
            message: res.statusText || 'Request failed.',
            status: res.status,
          };
    throw new BffApiError(errBody);
  }

  return payload as T;
}

export const authApi = {
  signup: (input: SignupInput) => postJson<BffSignupResult>('/api/auth/signup', input),
  verify: (input: VerifyInput) => postJson<BffSession>('/api/auth/verify', input),
  login: (input: LoginInput) => postJson<BffSession>('/api/auth/login', input),
  logout: () => postJson<BffLogoutResult>('/api/auth/logout'),
};

import 'server-only';
import { serverEnv } from '@/shared/config/env';
import type { BffErrorBody } from '@/types/auth';

/**
 * Server-side HTTP client used by BFF route handlers when calling upstream
 * services (auth_service, test_api).
 *
 * Responsibilities:
 *   - Apply a sane request timeout (AbortController).
 *   - Serialize JSON bodies; never silently leak undefined fields.
 *   - Return a discriminated `UpstreamResult` instead of throwing, so route
 *     handlers can branch cleanly.
 *   - Disable Next.js fetch caching (these are auth-sensitive calls).
 */

export interface UpstreamRequestInit extends Omit<RequestInit, 'body' | 'signal'> {
  json?: unknown;
  /** Override default timeout for this call. */
  timeoutMs?: number;
  /** Authorization bearer token to forward (if any). */
  bearer?: string;
}

export type UpstreamResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; data: unknown; error: BffErrorBody };

function buildHeaders(init: UpstreamRequestInit): Headers {
  const h = new Headers(init.headers);
  h.set('accept', 'application/json');
  if (init.json !== undefined && !h.has('content-type')) {
    h.set('content-type', 'application/json');
  }
  if (init.bearer) {
    h.set('authorization', `Bearer ${init.bearer}`);
  }
  return h;
}

async function readBody(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await res.text();
    return text.length === 0 ? null : text;
  } catch {
    return null;
  }
}

function normalizeError(status: number, body: unknown): BffErrorBody {
  // auth_service errors often look like { status:false, message, error }.
  // Normalize to BffErrorBody so the SPA always sees the same shape.
  if (body && typeof body === 'object' && 'message' in body) {
    const b = body as Record<string, unknown>;
    return {
      ok: false,
      code: typeof b.error === 'string' ? b.error : `http_${status}`,
      message: typeof b.message === 'string' ? b.message : 'Upstream error',
      status,
      details: body,
    };
  }
  return {
    ok: false,
    code: `http_${status}`,
    message: typeof body === 'string' && body.length > 0 ? body : `Upstream error (${status})`,
    status,
    details: body,
  };
}

export async function upstreamFetch<T>(
  url: string,
  init: UpstreamRequestInit = {},
): Promise<UpstreamResult<T>> {
  const { json, timeoutMs, bearer: _bearer, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? serverEnv.UPSTREAM_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: buildHeaders(init),
      body: json !== undefined ? JSON.stringify(json) : (rest as RequestInit).body,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: aborted ? 504 : 502,
      data: null,
      error: {
        ok: false,
        code: aborted ? 'upstream_timeout' : 'upstream_unreachable',
        message: aborted
          ? 'Upstream service did not respond in time.'
          : 'Failed to reach upstream service.',
        status: aborted ? 504 : 502,
      },
    };
  }
  clearTimeout(timeout);

  const data = await readBody(res);
  if (res.ok) {
    return { ok: true, status: res.status, data: data as T };
  }
  return { ok: false, status: res.status, data, error: normalizeError(res.status, data) };
}

/**
 * Convenience: build a full URL for the auth_service and test_api with a
 * leading slash on `path` enforced (so callers cannot accidentally produce
 * `${base}auth/login`).
 */
export function authServiceUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${serverEnv.AUTH_SERVICE_URL}${p}`;
}

export function testApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${serverEnv.TEST_API_URL}${p}`;
}

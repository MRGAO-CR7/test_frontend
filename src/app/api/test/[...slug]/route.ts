import { type NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/shared/config/env';
import { testApiUrl } from '@/shared/api/server-http';
import type { BffErrorBody } from '@/types/auth';

export const runtime = 'nodejs';
// Auth-bearing requests must never be cached at the framework layer.
export const dynamic = 'force-dynamic';

/**
 * Catch-all proxy: SPA -> Next BFF -> test_api.
 *
 *   /api/test/orders          -> ${TEST_API_URL}/orders
 *   /api/test/users/42?x=1    -> ${TEST_API_URL}/users/42?x=1
 *
 * Responsibilities:
 *   - Forward `Authorization: Bearer <access>` to test_api unchanged.
 *   - Forward query string and request body byte-for-byte.
 *   - Apply the BFF upstream timeout.
 *   - On the way back, return upstream status + JSON to the SPA.
 *
 * Hop-by-hop headers (Connection, Transfer-Encoding, ...) are NOT forwarded
 * — fetch handles those automatically. We only forward content-type, accept,
 * and authorization.
 *
 * Note: this proxy does NOT validate the JWT — that is test_api's job
 * (it verifies the JWT signature via Entra JWKS).
 */

const FORWARDABLE_REQUEST_HEADERS = new Set([
  'authorization',
  'content-type',
  'accept',
  'accept-language',
]);

const FORWARDABLE_RESPONSE_HEADERS = new Set([
  'content-type',
  'cache-control',
  'etag',
  'last-modified',
]);

function unauthorized(): NextResponse {
  const body: BffErrorBody = {
    ok: false,
    code: 'unauthorized',
    message: 'Missing or invalid Authorization header.',
    status: 401,
  };
  return NextResponse.json(body, { status: 401 });
}

function badGateway(message = 'Failed to reach test_api.'): NextResponse {
  const body: BffErrorBody = {
    ok: false,
    code: 'upstream_unreachable',
    message,
    status: 502,
  };
  return NextResponse.json(body, { status: 502 });
}

function gatewayTimeout(): NextResponse {
  const body: BffErrorBody = {
    ok: false,
    code: 'upstream_timeout',
    message: 'test_api did not respond in time.',
    status: 504,
  };
  return NextResponse.json(body, { status: 504 });
}

async function proxy(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
    return unauthorized();
  }

  const { slug } = await ctx.params;
  const path = `/${(slug ?? []).join('/')}`;
  const search = req.nextUrl.search;
  const target = `${testApiUrl(path)}${search}`;

  const headers = new Headers();
  for (const [key, value] of req.headers) {
    if (FORWARDABLE_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };

  // Pass-through body for non-GET/HEAD. Use the raw stream when possible.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
    // duplex: 'half' is required by Node fetch when streaming a request body.
    (init as { duplex?: 'half' }).duplex = 'half';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), serverEnv.UPSTREAM_TIMEOUT_MS);
  init.signal = controller.signal;

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return aborted ? gatewayTimeout() : badGateway();
  }
  clearTimeout(timer);

  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers) {
    if (FORWARDABLE_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: RouteContext<'/api/test/[...slug]'>) {
  return proxy(req, ctx);
}

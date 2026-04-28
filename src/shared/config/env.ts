import 'server-only';
import { z } from 'zod';

/**
 * Server-side environment validation.
 *
 * Marked `server-only` so any accidental import from client code fails the
 * build instead of silently leaking secrets into the browser bundle.
 */

const ServerEnvSchema = z.object({
  AUTH_SERVICE_URL: z.url().describe('auth_service base URL, e.g. /api/v1'),
  TEST_API_URL: z.url().describe('test_api base URL, e.g. /api/v1'),

  AUTH_REFRESH_COOKIE_NAME: z.string().min(1).default('rt'),
  AUTH_COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  AUTH_COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

function loadServerEnv() {
  const parsed = ServerEnvSchema.safeParse({
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
    TEST_API_URL: process.env.TEST_API_URL,
    AUTH_REFRESH_COOKIE_NAME: process.env.AUTH_REFRESH_COOKIE_NAME,
    AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
    UPSTREAM_TIMEOUT_MS: process.env.UPSTREAM_TIMEOUT_MS,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid server environment variables. Check .env.local against .env.example:\n${issues}`,
    );
  }

  return parsed.data;
}

/**
 * Strip a single trailing `/` so callers can do `${base}/auth/login` without
 * worrying about double slashes.
 */
function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const raw = loadServerEnv();

export const serverEnv = {
  ...raw,
  AUTH_SERVICE_URL: stripTrailingSlash(raw.AUTH_SERVICE_URL),
  TEST_API_URL: stripTrailingSlash(raw.TEST_API_URL),
} as const;

export type ServerEnv = typeof serverEnv;

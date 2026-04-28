/**
 * Minimal JWT helper for the BROWSER side.
 *
 * Scope: read `exp` (and optionally a few user-friendly claims like `email`)
 * to decide *when* to refresh. NEVER use these values for authorization
 * decisions — the actual signature is verified upstream (test_api / Entra).
 *
 * Works in both Node and browser; uses `atob` which exists in modern Node
 * (>=16) and all modern browsers. We do not pull a JWT library to keep the
 * client bundle lean.
 */

interface JwtPayload {
  exp?: number;
  iat?: number;
  email?: string;
  oid?: string;
  sub?: string;
  [k: string]: unknown;
}

function base64UrlDecode(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof atob === 'function') return atob(b64);
  return Buffer.from(b64, 'base64').toString('binary');
}

function utf8Decode(binary: string): string {
  try {
    return decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
  } catch {
    return binary;
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = utf8Decode(base64UrlDecode(parts[1]));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns expiration in epoch milliseconds, or null if unparseable. */
export function getJwtExpiresAtMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
}

/**
 * Compute `expires_at` (epoch ms) from a token bundle.
 * Prefer the JWT's `exp` claim (authoritative); fall back to `expires_in`
 * relative to now() if the claim is missing or unparseable.
 */
export function computeExpiresAtMs(args: { accessToken: string; expiresIn: number }): number {
  const fromJwt = getJwtExpiresAtMs(args.accessToken);
  if (fromJwt !== null) return fromJwt;
  return Date.now() + args.expiresIn * 1000;
}

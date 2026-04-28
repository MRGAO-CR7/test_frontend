/**
 * Shared auth types — used by SPA, BFF route handlers, and feature modules.
 *
 * Mirrors the auth_service contract:
 *   POST /auth/login   { email, password, remember_me? } -> { tokens, user }
 *   POST /auth/refresh { refresh_token } -> { tokens, user? }
 *   POST /auth/signup  { email, password, first_name?, last_name } -> { ok }
 *   POST /auth/verify  { email, oob } -> { tokens, user }   (no refresh_token)
 *
 * The BFF layer hides refresh_token from the browser entirely; the SPA only
 * ever sees `BffSession` (access_token + user + expires_in).
 */

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

/** Token bundle as returned by auth_service (server-internal). */
export interface UpstreamTokenBundle {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
}

/** Shape auth_service returns from /login, /verify, /refresh (success). */
export interface UpstreamAuthSuccess {
  status: true;
  user?: AuthUser;
  tokens: UpstreamTokenBundle;
}

/** Shape auth_service returns on failure. */
export interface UpstreamAuthError {
  status: false;
  message: string;
  error?: string;
}

/**
 * What the BFF returns to the browser on login / verify / refresh / me.
 *
 * IMPORTANT: never includes `refresh_token`. That value is HttpOnly cookie only.
 */
export interface BffSession {
  access_token: string;
  expires_in: number;
  expires_at: number;
  user: AuthUser;
}

/** What the BFF returns on signup (no tokens — verify step issues them). */
export interface BffSignupResult {
  ok: true;
  email: string;
}

/** Normalized error shape exposed to the SPA for any /api/auth/* failure. */
export interface BffErrorBody {
  ok: false;
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export type BffResult<T> = T | BffErrorBody;

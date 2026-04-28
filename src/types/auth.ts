/**
 * Shared auth types — used by SPA, BFF route handlers, and feature modules.
 *
 * Mirrors the auth_service contract:
 *
 *   POST /auth/signup  -> { status:true, message, challenge_target_label, code_length, interval }
 *   POST /auth/verify  -> { status:true, message, user_uuid, email, first_name, last_name,
 *                           tokens: { access_token, token_type, expires_in } }   // 201, no refresh
 *   POST /auth/login   -> { status:true, message, user_uuid, email,
 *                           tokens: { access_token, token_type, expires_in, refresh_token? } }
 *   POST /auth/refresh -> { status:true, message, user_uuid, email,
 *                           tokens: { access_token, token_type, expires_in, refresh_token } }
 *   error (any)        -> { status:false, message, error?: 'code' }   // 4xx
 *
 * The BFF strips `refresh_token` from JSON and sets it as an HttpOnly cookie.
 * The SPA only ever sees `BffSession` (access_token + user + expires_in).
 */

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface UpstreamTokenBundle {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
}

/** Shape auth_service returns from /login, /verify, /refresh. */
export interface UpstreamAuthSuccess {
  status: true;
  message?: string;
  user_uuid?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  tokens: UpstreamTokenBundle;
}

/** Shape auth_service returns from /signup (no tokens). */
export interface UpstreamSignupSuccess {
  status: true;
  message?: string;
  challenge_target_label?: string;
  code_length?: number;
  interval?: number;
}

/** Shape auth_service returns on any failure. */
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

/** Public response of POST /api/auth/signup. */
export interface BffSignupResult {
  ok: true;
  email: string;
  challenge_target_label?: string;
  code_length?: number;
  interval?: number;
}

/** Public response of POST /api/auth/logout. */
export interface BffLogoutResult {
  ok: true;
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

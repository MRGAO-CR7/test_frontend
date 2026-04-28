import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { AuthUser, BffSession } from '@/types/auth';
import { computeExpiresAtMs } from '@/shared/lib/jwt';

/**
 * Auth state — IN-MEMORY ONLY. Deliberately not persisted.
 *
 * Persistence anti-patterns we avoid:
 *   - localStorage / sessionStorage: readable by any script -> XSS payload heaven
 *   - js-readable cookies:           same problem, plus CSRF surface
 *
 * On hard reload the store is empty. `<AuthBootstrap />` calls
 * `GET /api/auth/me`, which tries to mint a fresh access_token using the
 * HttpOnly refresh cookie. If that succeeds we re-hydrate; otherwise the
 * user is sent to /login.
 */

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  /** Epoch ms when the current access_token expires. */
  expiresAt: number | null;
  /** True until first /api/auth/me call settles after app boot. */
  isBootstrapping: boolean;

  status: AuthStatus;
}

interface AuthActions {
  setSession(session: BffSession): void;
  /** Used when only access_token + expires_in are known (e.g. after refresh). */
  setTokens(args: { accessToken: string; expiresIn: number; user?: AuthUser }): void;
  setUser(user: AuthUser | null): void;
  setBootstrapping(v: boolean): void;
  clear(): void;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  expiresAt: null,
  isBootstrapping: true,
  status: 'idle',
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setSession: (session) =>
    set({
      accessToken: session.access_token,
      expiresAt: session.expires_at,
      user: session.user,
      isBootstrapping: false,
      status: 'authenticated',
    }),

  setTokens: ({ accessToken, expiresIn, user }) =>
    set((s) => ({
      accessToken,
      expiresAt: computeExpiresAtMs({ accessToken, expiresIn }),
      user: user ?? s.user,
      isBootstrapping: false,
      status: 'authenticated',
    })),

  setUser: (user) => set((s) => ({ user, status: user ? s.status : 'unauthenticated' })),

  setBootstrapping: (v) => set({ isBootstrapping: v }),

  clear: () =>
    set({
      ...initialState,
      isBootstrapping: false,
      status: 'unauthenticated',
    }),
}));

/**
 * Imperative accessor — useful from the axios interceptor where we are
 * outside React and cannot subscribe via hooks.
 */
export const authStore = {
  get state() {
    return useAuthStore.getState();
  },
  setSession: (s: BffSession) => useAuthStore.getState().setSession(s),
  setTokens: (args: Parameters<AuthActions['setTokens']>[0]) =>
    useAuthStore.getState().setTokens(args),
  clear: () => useAuthStore.getState().clear(),
};

/** Hook returning a stable selector for the most common subset of state. */
export const useAuthSession = () =>
  useAuthStore(
    useShallow((s) => ({
      accessToken: s.accessToken,
      user: s.user,
      status: s.status,
      isBootstrapping: s.isBootstrapping,
    })),
  );

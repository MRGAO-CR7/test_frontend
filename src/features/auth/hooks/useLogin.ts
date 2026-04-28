'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, BffApiError } from '@/features/auth/api/client';
import { authStore } from '@/features/auth/store/authStore';
import { publishAuth } from '@/shared/lib/broadcast';
import { toast } from '@/shared/store/toastStore';
import type { LoginInput } from '@/features/auth/schemas';
import type { BffSession } from '@/types/auth';

/**
 * Login mutation.
 *   - Persists the session to the in-memory store
 *   - Broadcasts to other tabs
 *   - Redirects to /dashboard (caller can override via `redirectTo`)
 */
export function useLogin(redirectTo: string = '/dashboard') {
  const router = useRouter();
  return useMutation<BffSession, Error, LoginInput>({
    mutationFn: (input) => authApi.login(input),
    onSuccess: (session) => {
      authStore.setSession(session);
      publishAuth({
        type: 'login',
        accessToken: session.access_token,
        expiresAt: session.expires_at,
        user: session.user,
      });
      toast.success('Signed in', `Welcome back, ${session.user.email}`);
      router.replace(redirectTo);
    },
    onError: (err) => {
      const msg = err instanceof BffApiError ? err.message : 'Network or server error.';
      toast.error('Sign-in failed', msg);
    },
  });
}

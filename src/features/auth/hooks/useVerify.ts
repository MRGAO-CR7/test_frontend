'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/client';
import { authStore } from '@/features/auth/store/authStore';
import { publishAuth } from '@/shared/lib/broadcast';
import type { VerifyInput } from '@/features/auth/schemas';
import type { BffSession } from '@/types/auth';

/**
 * Verify mutation — completes signup with the OOB code.
 *
 * On success auth_service issues an access_token (no refresh — registration
 * has no remember_me semantics), so we hydrate the in-memory store and head
 * to /dashboard. The user will need to /login again once that token expires.
 */
export function useVerify() {
  const router = useRouter();
  return useMutation<BffSession, Error, VerifyInput>({
    mutationFn: (input) => authApi.verify(input),
    onSuccess: (session) => {
      authStore.setSession(session);
      publishAuth({
        type: 'login',
        accessToken: session.access_token,
        expiresAt: session.expires_at,
        user: session.user,
      });
      router.replace('/dashboard');
    },
  });
}

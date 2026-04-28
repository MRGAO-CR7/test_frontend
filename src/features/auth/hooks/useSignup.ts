'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/client';
import type { SignupInput } from '@/features/auth/schemas';
import type { BffSignupResult } from '@/types/auth';

/**
 * Signup mutation.
 *
 * On success the user has been issued an OOB code by email; we hand off to
 * /verify with the email pre-filled in the query string.
 */
export function useSignup() {
  const router = useRouter();
  return useMutation<BffSignupResult, Error, SignupInput>({
    mutationFn: (input) => authApi.signup(input),
    onSuccess: (data) => {
      const params = new URLSearchParams({ email: data.email });
      router.replace(`/verify?${params.toString()}`);
    },
  });
}

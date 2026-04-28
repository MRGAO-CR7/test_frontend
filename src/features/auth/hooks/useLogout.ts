'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/client';
import { authStore } from '@/features/auth/store/authStore';
import { publishAuth } from '@/shared/lib/broadcast';
import { toast } from '@/shared/store/toastStore';

/**
 * Logout mutation.
 *
 *   1. Drops the BFF refresh cookie (POST /api/auth/logout — idempotent).
 *   2. Clears the in-memory auth store.
 *   3. Broadcasts to other tabs.
 *   4. Wipes react-query cache so no stale per-user data leaks.
 *   5. Redirects to /login.
 *
 * Best-effort: even if the network call fails, we still log the user out
 * locally — they pressed the button.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } catch {
        /* ignore — clean up locally anyway */
      }
    },
    onSettled: () => {
      authStore.clear();
      publishAuth({ type: 'logout' });
      queryClient.clear();
      toast.info('Signed out');
      router.replace('/login');
    },
  });
}

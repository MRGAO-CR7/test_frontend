'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@/features/auth/store/authStore';
import { Spinner } from '@/shared/components/Spinner';

/**
 * Wraps protected route subtrees.
 *
 *   - While `<AuthBootstrap />` is still resolving /api/auth/me, render a
 *     splash so we don't flash a half-rendered protected page.
 *   - When bootstrap settles `unauthenticated`, redirect to /login.
 *   - When `authenticated`, render children.
 *
 * Note: this is a defence-in-depth layer. The primary gate is `proxy.ts`
 * which redirects /-style entries server-side based on the cookie. Anyone
 * who somehow arrives at /dashboard without a valid session will be
 * bounced here.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, isBootstrapping } = useAuthSession();

  useEffect(() => {
    if (!isBootstrapping && status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [isBootstrapping, status, router]);

  if (isBootstrapping || status === 'idle') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={28} className="text-zinc-400" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    // Redirect kicks in via the effect above; render nothing in the meantime.
    return null;
  }

  return <>{children}</>;
}

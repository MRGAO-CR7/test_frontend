'use client';

import { useAuthSession } from '@/features/auth/store/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Button } from '@/shared/components/Button';

export function TopBar() {
  const { user } = useAuthSession();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            test_frontend
          </span>
          <span className="hidden text-xs text-zinc-400 sm:inline dark:text-zinc-500">
            · dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden truncate text-sm text-zinc-600 sm:inline dark:text-zinc-300">
            {user?.email ?? '—'}
          </span>
          <Button
            variant="secondary"
            size="sm"
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';
import { AuthGuard } from '@/shared/guards/AuthGuard';
import { TopBar } from '@/shared/components/TopBar';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
        <TopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </AuthGuard>
  );
}

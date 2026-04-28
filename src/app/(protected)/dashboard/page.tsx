import type { Metadata } from 'next';
import { HealthPanel } from '@/features/dashboard/components/HealthPanel';
import { UserCard } from '@/features/dashboard/components/UserCard';

export const metadata: Metadata = {
  title: 'Dashboard · test_frontend',
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Demo of the end-to-end auth path: BFF cookie session, axios single-flight refresh, and a
          transparent proxy to test_api.
        </p>
      </div>

      <UserCard />
      <HealthPanel />
    </div>
  );
}

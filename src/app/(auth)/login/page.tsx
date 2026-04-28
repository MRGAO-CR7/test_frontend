import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in · test_frontend',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome back</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to access your dashboard.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

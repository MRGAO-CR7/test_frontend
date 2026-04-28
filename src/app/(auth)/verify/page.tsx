import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { VerifyForm } from '@/features/auth/components/VerifyForm';

export const metadata: Metadata = {
  title: 'Verify email · test_frontend',
};

interface PageProps {
  searchParams: Promise<{ email?: string | string[] }>;
}

export default async function VerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.email;
  const email = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';

  if (!email) {
    redirect('/signup');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Verify your email</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the 6-digit code we sent to <span className="font-medium">{email}</span>.
        </p>
      </div>
      <VerifyForm email={email} />
    </div>
  );
}

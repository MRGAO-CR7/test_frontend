'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VerifyInputSchema, type VerifyInput } from '@/features/auth/schemas';
import { useVerify } from '@/features/auth/hooks/useVerify';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

interface VerifyFormProps {
  email: string;
}

export function VerifyForm({ email }: VerifyFormProps) {
  const verify = useVerify();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
    resolver: zodResolver(VerifyInputSchema),
    defaultValues: { email, oob: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await verify.mutateAsync(values).catch(() => {});
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        readOnly
        className="bg-zinc-50 dark:bg-zinc-900/60"
        {...register('email')}
      />

      <Input
        label="Verification code"
        autoComplete="one-time-code"
        inputMode="numeric"
        placeholder="6-digit code"
        autoFocus
        hint="Check your inbox — codes expire in 5 minutes."
        error={errors.oob?.message}
        {...register('oob')}
      />

      {verify.isError && (
        <Alert tone="error" title="Verification failed">
          {verify.error?.message ?? 'Please double-check the code and try again.'}
        </Alert>
      )}

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || verify.isPending}>
        Verify and continue
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Wrong email?{' '}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Restart sign up
        </Link>
      </p>
    </form>
  );
}

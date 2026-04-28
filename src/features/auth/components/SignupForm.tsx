'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignupInputSchema, type SignupInput } from '@/features/auth/schemas';
import { useSignup } from '@/features/auth/hooks/useSignup';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function SignupForm() {
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupInputSchema),
    defaultValues: { email: '', password: '', first_name: '', last_name: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await signup.mutateAsync(values).catch(() => {});
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          autoComplete="given-name"
          placeholder="Optional"
          error={errors.first_name?.message}
          {...register('first_name')}
        />
        <Input
          label="Last name"
          autoComplete="family-name"
          placeholder="Required"
          error={errors.last_name?.message}
          {...register('last_name')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters with a mix of letters, numbers, and symbols."
        error={errors.password?.message}
        {...register('password')}
      />

      {signup.isError && (
        <Alert tone="error" title="Sign up failed">
          {signup.error?.message ?? 'Please try again.'}
        </Alert>
      )}

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || signup.isPending}>
        Create account
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

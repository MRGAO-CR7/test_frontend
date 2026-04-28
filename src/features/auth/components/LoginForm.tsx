'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInputSchema, type LoginInput } from '@/features/auth/schemas';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: { email: '', password: '', remember_me: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    await login.mutateAsync(values).catch(() => {
      /* error surfaced via login.error */
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-600 dark:accent-zinc-50"
          {...register('remember_me')}
        />
        Keep me signed in
      </label>

      {login.isError && (
        <Alert tone="error" title="Login failed">
          {login.error?.message ?? 'Please try again.'}
        </Alert>
      )}

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting || login.isPending}>
        Sign in
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        New here?{' '}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

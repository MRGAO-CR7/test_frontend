'use client';

import { useAuthSession } from '@/features/auth/store/authStore';

export function UserCard() {
  const { user, accessToken } = useAuthSession();

  if (!user) return null;

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
  const tokenPreview = accessToken
    ? `${accessToken.slice(0, 24)}…${accessToken.slice(-8)}`
    : 'none';

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Signed in as</h2>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <Row term="Name" value={name} />
        <Row term="Email" value={user.email} />
        <Row term="User ID" value={user.id} mono />
        <Row term="Access token (in memory)" value={tokenPreview} mono />
      </dl>
    </section>
  );
}

function Row({ term, value, mono }: { term: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">{term}</dt>
      <dd
        className={`mt-0.5 break-all text-zinc-900 dark:text-zinc-100 ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

import { Spinner } from '@/shared/components/Spinner';

/**
 * The root page is intentionally minimal — `proxy.ts` redirects `/` to either
 * `/dashboard` or `/login` based on the refresh cookie before this ever
 * renders. We keep a tiny splash here as a fallback so direct hits during a
 * proxy cold start don't show a blank page.
 */
export default function RootPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner size={28} className="text-zinc-400" />
    </div>
  );
}

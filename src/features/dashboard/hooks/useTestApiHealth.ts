'use client';

import { useQuery } from '@tanstack/react-query';
import { testApi } from '@/features/dashboard/api/client';

export function useTestApiHealth() {
  return useQuery({
    queryKey: ['dashboard', 'test_api', 'health'],
    queryFn: () => testApi.health(),
    staleTime: 30_000,
  });
}

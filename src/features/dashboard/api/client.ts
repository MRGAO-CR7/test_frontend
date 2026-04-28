import { http } from '@/shared/api/http';

/**
 * Browser-side calls into test_api, all of which transit the BFF
 * catch-all proxy at /api/test/[...slug].
 *
 * We use the shared axios `http` instance so requests automatically:
 *   - get the in-memory access_token attached as a Bearer header
 *   - participate in single-flight refresh on 401
 *   - participate in proactive refresh near expiry
 */

export interface TestApiHealth {
  status?: string;
  service?: string;
  version?: string;
  [key: string]: unknown;
}

export const testApi = {
  health: async (): Promise<TestApiHealth> => {
    const { data } = await http.get<TestApiHealth>('/api/test/health');
    return data;
  },
};

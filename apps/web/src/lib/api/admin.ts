import { apiRequest } from '@/lib/api/client';
import { buildQueryStringFromObject } from '@/lib/api/query';
import type { AdminMetrics } from '@/lib/types';

export function getAdminMetrics(filters: {
  from?: string;
  to?: string;
}): Promise<AdminMetrics> {
  return apiRequest<AdminMetrics>(`/admin/metrics${buildQueryStringFromObject(filters)}`);
}

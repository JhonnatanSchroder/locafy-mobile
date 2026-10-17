import { api } from './api';
import type { AuditDetail, AuditFilters, AuditPage } from '@/types/audit';

function queryString(filters: AuditFilters = {}, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export function getAudits(filters: AuditFilters = {}, page = 1) {
  return api<AuditPage>(`/audits?${queryString(filters, page)}`);
}

export async function getAudit(id: number | string) {
  const response = await api<{ data: AuditDetail }>(`/audits/${id}`);
  return response.data;
}

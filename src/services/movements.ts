import { api } from './api';
import type { MovementInput } from '@/types/operations';
import type { MovementFilters, Movement, PaginatedMovements } from '@/types/movement';
export const createMovement = (input: MovementInput) => api(`/contracts/${input.contract_id}/movements`, { method: 'POST', body: JSON.stringify(input) });

export function listMovements(filters: MovementFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.type && filters.type !== 'ALL') params.set('type', filters.type);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);

  return api<PaginatedMovements>(`/movements?${params.toString()}`);
}

export function getMovement(id: number | string) {
  return api<{ data: Movement }>(`/movements/${id}`);
}

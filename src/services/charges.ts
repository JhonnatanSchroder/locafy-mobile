import { api } from './api';
import { allPages, unwrap } from './resources';
import type { Charge } from '@/types/charge';

export type ChargeFilter = 'today' | 'overdue' | 'upcoming' | 'all';
export function getCharges(filter: ChargeFilter = 'all', contractId?: number | string) {
  return allPages<Charge>(`/charges?filter=${filter === 'all' ? 'outstanding' : filter}${contractId ? `&contract_id=${encodeURIComponent(contractId)}` : ''}`);
}
export async function getCharge(id: number | string) { return unwrap(await api<Charge | { data: Charge }>(`/charges/${id}`)); }

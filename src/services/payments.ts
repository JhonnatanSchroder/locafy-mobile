import { api } from './api';
import { unwrap } from './resources';
import type { Charge, PaymentInput } from '@/types/charge';
import type { PaginatedPayments, Payment, PaymentFilters } from '@/types/payment';
import { getCharge } from './charges';
import { getContract } from './contracts';
import { notifyFinancialUpdate } from './financialUpdates';
import { notifyDashboardUpdate } from './dashboardUpdates';
export async function registerPayment(contractId: number, input: PaymentInput) {
  return unwrap(await api<Charge | { data: Charge }>(`/contracts/${contractId}/payments`, { method: 'POST', body: JSON.stringify(input) }));
}
export function listPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.contract_id) params.set('contract_id', String(filters.contract_id));
  if (filters.client_id) params.set('client_id', String(filters.client_id));
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.payment_method && filters.payment_method !== 'ALL') params.set('payment_method', filters.payment_method);

  return api<PaginatedPayments>(`/payments?${params.toString()}`);
}
export function getPayment(id: number | string) {
  return api<{ data: Payment }>(`/payments/${id}`);
}
export async function refreshPaymentContext(contractId: number) {
  const [charge, response] = await Promise.all([getCharge(contractId), getContract(contractId)]);
  notifyFinancialUpdate(response.data);
  notifyDashboardUpdate();
  return charge;
}

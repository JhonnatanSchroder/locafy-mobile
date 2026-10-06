import { api } from './api';
import { unwrap } from './resources';
import type { Charge, PaymentInput } from '@/types/charge';
import { getCharge } from './charges';
import { getContract } from './contracts';
import { notifyFinancialUpdate } from './financialUpdates';
import { notifyDashboardUpdate } from './dashboardUpdates';
export async function registerPayment(contractId: number, input: PaymentInput) {
  return unwrap(await api<Charge | { data: Charge }>(`/contracts/${contractId}/payments`, { method: 'POST', body: JSON.stringify(input) }));
}
export async function refreshPaymentContext(contractId: number) {
  const [charge, response] = await Promise.all([getCharge(contractId), getContract(contractId)]);
  notifyFinancialUpdate(response.data);
  notifyDashboardUpdate();
  return charge;
}

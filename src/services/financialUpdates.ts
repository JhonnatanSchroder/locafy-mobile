import type { Contract } from '@/types/contract';
const listeners = new Set<(contract: Contract) => void>();
export function subscribeFinancialUpdates(listener: (contract: Contract) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function notifyFinancialUpdate(contract: Contract) { listeners.forEach(listener => listener(contract)); }

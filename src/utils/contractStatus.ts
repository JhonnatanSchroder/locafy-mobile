import type { Contract } from '@/types/contract';

// Presentation only. Persisted status and balance always come from Laravel.
export function contractPresentation(contract: Pick<Contract, 'status' | 'balance' | 'financial_balance' | 'can_finalize' | 'display_status_label'>) {
  const balance = contract.financial_balance ?? contract.balance;
  const closed = contract.status === 'FINALIZED' || contract.status === 'CANCELLED';
  const ready = contract.status === 'RETURNED' && (contract.can_finalize ?? false);
  const pending = contract.status === 'RETURNED' && balance != null && Number(balance) > 0;
  return { closed, ready, pending, label: contract.display_status_label ?? (ready ? 'Pronto para finalizar' : pending ? 'Pendente de pagamento' : { ACTIVE: 'Ativo', RETURNED: 'Devolvido', FINALIZED: 'Finalizado', CANCELLED: 'Cancelado' }[contract.status]) };
}

export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export type Charge = {
  id: string;
  contractId: string;
  clientName: string;
  dueDate: string;
  amount: number;
  remainingAmount: number;
  status: ChargeStatus;
  observation?: string | null;
};

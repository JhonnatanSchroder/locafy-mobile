import type { ContractStatus } from './contract';
export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'UNAVAILABLE';

export type Charge = {
  id: number;
  contract_id: number;
  client: string;
  next_charge_date: string | null;
  charge_interval_days: number;
  rental_total: string | null;
  freight_total: string | null;
  total_accrued: string | null;
  total_paid: string | null;
  total_discount?: string | null;
  balance: string | null;
  financial_balance?: string | null;
  financial_status: ChargeStatus;
  contract_status: ContractStatus;
  is_collectible: boolean;
  due_today: boolean;
  days_overdue: number;
  notes: string | null;
  payments?: Payment[];
};
export type PaymentMethod = 'PIX' | 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
export type Payment = { id: number; amount: string; discount_amount?: string | null; settled_amount?: string | null; paid_at: string; method: PaymentMethod; notes: string | null };
export type PaymentInput = { amount: string; discount_amount?: string; paid_at: string; method: PaymentMethod; notes: string | null };

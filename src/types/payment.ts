import type { PaginationLinks, PaginationMeta } from './contract';
import type { PaymentMethod } from './charge';

export type PaymentClient = {
  id: number;
  name: string;
  phone: string | null;
};

export type PaymentContract = {
  id: number;
  number: number;
  status: string;
};

export type Payment = {
  id: number;
  contract_id: number;
  charge_id: number | null;
  client: PaymentClient | null;
  client_name: string;
  amount: string;
  discount_amount: string | null;
  settled_amount: string | null;
  paid_at: string;
  method: PaymentMethod;
  notes: string | null;
  contract: PaymentContract | null;
};

export type PaymentFilters = {
  page?: number;
  search?: string;
  contract_id?: number | string;
  client_id?: number | string;
  date_from?: string | null;
  date_to?: string | null;
  payment_method?: PaymentMethod | 'ALL';
};

export type PaginatedPayments = {
  data: Payment[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

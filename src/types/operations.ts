export type BillingPeriod = 'DAY' | 'WEEK' | 'MONTH';
export type ContractItemInput = { id?: number; product_id: number; billing_period: BillingPeriod; unit_price: string; initial_quantity?: number };
export type ContractInput = {
  client_id: number;
  worksite_address: string | null;
  started_at: string;
  charge_saturdays: boolean;
  next_charge_date: string | null;
  charge_interval_days?: number;
  notes: string | null;
  items: ContractItemInput[];
  initial_freight?: { quantity: number; unit_amount: string; notes?: string | null };
};
export type MovementInput = { contract_id: number; type: 'WITHDRAWAL' | 'RETURN'; occurred_at: string; notes: string | null; items: { contract_item_id: number; quantity: number; equipment_id?: number }[] };
export type FreightInput = { quantity: number; unit_amount: string; occurred_at: string; notes: string | null };

export type Product = {
  id: number;
  name: string;
  type: 'QUANTITY' | 'INDIVIDUAL';
  type_label: string;
  default_price: string | null;
  unit: string | null;
  stock_total: number | null;
  active: boolean;
};
export type Equipment = {
  id: number;
  name: string;
  brand: string | null;
  notes: string | null;
  status: string;
  status_label: string;
  product?: Product;
};

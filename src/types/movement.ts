import type { PaginationLinks, PaginationMeta } from './contract';

export type MovementType = 'WITHDRAWAL' | 'RETURN';

export type MovementItem = {
  id: number;
  contract_item_id: number;
  quantity: number;
  product?: {
    id: number;
    name: string;
    type?: string;
  } | null;
  equipment?: {
    id: number;
    name: string;
  } | null;
};

export type Movement = {
  id: number;
  type: MovementType;
  type_label?: string;
  occurred_at: string | null;
  notes?: string | null;
  contract?: {
    id: number;
    number: number;
    status?: string;
    worksite_address?: string | null;
    client?: {
      id: number;
      name: string;
      phone?: string | null;
    } | null;
  } | null;
  items: MovementItem[];
};

export type MovementFilters = {
  page?: number;
  search?: string;
  type?: MovementType | 'ALL';
  date_from?: string | null;
  date_to?: string | null;
};

export type PaginatedMovements = {
  data: Movement[];
  links: PaginationLinks;
  meta: PaginationMeta;
};

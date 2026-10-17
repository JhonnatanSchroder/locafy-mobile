export type AuditState = Record<string, unknown> | null;

export type Audit = {
  id: number;
  module: string | null;
  entity_type: string;
  entity_id: number;
  operation: string;
  source: string | null;
  user: string | null;
  created_at: string | null;
};

export type AuditDetail = Audit & {
  company_id: number;
  user_id: number | null;
  user_snapshot: Record<string, unknown> | null;
  reason: string | null;
  before_state: AuditState;
  after_state: AuditState;
};

export type AuditFilters = {
  from?: string;
  to?: string;
  module?: string;
  operation?: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
};

export type AuditPage = {
  data: Audit[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

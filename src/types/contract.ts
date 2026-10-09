
export type ContractStatus =
    | 'ACTIVE'
    | 'RETURNED'
    | 'FINALIZED'
    | 'CANCELLED';

export type ContractClient = {
    id: number;
    name: string;
    phone: string | null;
};

export type ContractItemProduct = {
    id: number;
    name: string;
    type: string;
};

export type ContractItem = {
    id: number;
    product: ContractItemProduct;
    billing_period: string;
    billing_period_label: string;
    unit_price: string;
    current_quantity: number | null;
    billable_quantity_days: number | null;
    accrued_subtotal: string | null;
};

export type ContractFreight = {
    id: number;
    quantity: number;
    unit_amount: string;
    total?: string | null;
    occurred_at?: string | null;
    notes?: string | null;
};

export type ContractAttachment = {
    id: number;
    original_name: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    uploaded_by?: string | { id?: number; name?: string } | null;
    view_url?: string | null;
    api_view_url?: string | null;
    url?: string | null;
    can_delete?: boolean;
};

export type ContractMovementItem = {
    id: number;
    contract_item_id: number;
    quantity: number;
    product?: ContractItemProduct | null;
    equipment?: {
        id: number;
        name: string;
    } | null;
};

export type ContractMovement = {
    id: number;
    type: 'WITHDRAWAL' | 'RETURN';
    type_label?: string;
    occurred_at: string | null;
    notes?: string | null;
    items: ContractMovementItem[];
};

export type Contract = {
    id: number;
    number: number;

    status: ContractStatus;
    status_label: string;
    display_status?: string;
    display_status_label?: string;
    can_finalize?: boolean;

    client: ContractClient;

    worksite_address: string | null;

    started_at: string;
    ended_at: string | null;

    next_charge_date: string | null;
    charge_interval_days?: number | null;

    charge_saturdays: boolean;

    notes: string | null;

    calculated_until: string | null;
    calculation_complete: boolean;

    rental_total: string | null;
    freight_count?: number;
    freight_total?: string | null;
    total_accrued?: string | null;
    total_paid?: string | null;
    total_discount?: string | null;
    balance?: string | null;
    financial_balance?: string | null;
    attachments_count?: number;
    attachments?: ContractAttachment[];
    can_upload_attachments?: boolean;
    freights?: ContractFreight[];
    movements?: ContractMovement[];

    items: ContractItem[];
};
export type PaginationLinks = {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
};

export type PaginationMeta = {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
};

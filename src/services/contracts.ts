import { api } from './api';

import type {
    Contract,
    PaginatedResponse,
} from '@/types/contract';

export async function getContracts() {
    return api<PaginatedResponse<Contract>>('/contracts');
}

export async function getContract(id: number | string) {
    return api<{ data: Contract }>(`/contracts/${id}`);
}

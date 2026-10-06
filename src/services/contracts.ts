import { api } from './api';
import { allPages, unwrap } from './resources';
import type { ContractInput } from '@/types/operations';
import type { Contract, ContractStatus } from '@/types/contract';
import { notifyFinancialUpdate } from './financialUpdates';

export async function getContracts() {
    return { data: await allPages<Contract>('/contracts') };
}

export async function getContract(id: number | string) {
    return api<{ data: Contract }>(`/contracts/${id}`);
}
export async function refreshContractOperations(id: number | string) {
    const response = await getContract(id);
    notifyFinancialUpdate(response.data);
    return response.data;
}
export async function finalizeContract(id: number | string) {
    await api(`/contracts/${id}/finalize`, { method: 'POST' });
    return refreshContractOperations(id);
}

export async function createContract(input: ContractInput) {
    return unwrap(await api<Contract | { data: Contract }>('/contracts', { method: 'POST', body: JSON.stringify(input) }));
}
export async function updateContract(id: number | string, input: ContractInput & { status: ContractStatus; ended_at: string | null }) {
    return unwrap(await api<Contract | { data: Contract }>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }));
}

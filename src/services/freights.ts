import { api } from './api';
import type { FreightInput } from '@/types/operations';
export const createFreight = (contractId: number, input: FreightInput) => api(`/contracts/${contractId}/freights`, { method: 'POST', body: JSON.stringify(input) });
export const updateFreight = (contractId: number, id: number, input: FreightInput) => api(`/contracts/${contractId}/freights/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

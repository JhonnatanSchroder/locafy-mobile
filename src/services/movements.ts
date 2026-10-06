import { api } from './api';
import type { MovementInput } from '@/types/operations';
export const createMovement = (input: MovementInput) => api(`/contracts/${input.contract_id}/movements`, { method: 'POST', body: JSON.stringify(input) });

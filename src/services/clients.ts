import { api } from '@/services/api';
import type { Client, ClientResponse, CreateClientInput, UpdateClientInput } from '@/types/client';
import type { PaginatedResponse } from '@/types/contract';

function normalizeClientResponse(response: ClientResponse): Client {
    return 'data' in response ? response.data : response;
}

export async function getClients({ search = '', page = 1, signal }: { search?: string; page?: number; signal?: AbortSignal } = {}) {
    return api<PaginatedResponse<Client>>(`/clients?search=${encodeURIComponent(search.trim())}&page=${page}`, { signal });
}

export async function getClient(id: number | string) {
    const response = await api<ClientResponse>(`/clients/${id}`);

    return normalizeClientResponse(response);
}

export async function createClient(input: CreateClientInput) {
    const response = await api<ClientResponse>('/clients', {
        method: 'POST',
        body: JSON.stringify(input),
    });

    return normalizeClientResponse(response);
}

export async function updateClient(id: number | string, input: UpdateClientInput) {
    const response = await api<ClientResponse>(`/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
    });

    return normalizeClientResponse(response);
}

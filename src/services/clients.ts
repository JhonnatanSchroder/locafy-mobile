import { api } from '@/services/api';
import type { Client, ClientResponse, ClientsResponse, CreateClientInput, UpdateClientInput } from '@/types/client';

function normalizeClientsResponse(response: ClientsResponse): Client[] {
    return Array.isArray(response) ? response : response.data;
}

function normalizeClientResponse(response: ClientResponse): Client {
    return 'data' in response ? response.data : response;
}

export async function getClients() {
    const response = await api<ClientsResponse>('/clients');

    return normalizeClientsResponse(response);
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

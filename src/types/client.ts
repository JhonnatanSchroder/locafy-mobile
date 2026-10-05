import type { PaginatedResponse } from '@/types/contract';

export type ClientType = 'INDIVIDUAL' | 'COMPANY';

export type Client = {
    id: number;
    type: ClientType;
    type_label: string;
    name: string;
    document: string | null;
    phone: string | null;
    residential_address: string | null;
    notes: string | null;
};

export type ClientPayload = {
    type: ClientType;
    name: string;
    document: string | null;
    phone: string | null;
    residential_address: string | null;
    notes: string | null;
};

export type CreateClientInput = ClientPayload;

export type UpdateClientInput = Partial<ClientPayload>;

export type ClientsResponse =
    | Client[]
    | {
          data: Client[];
      }
    | PaginatedResponse<Client>;

export type ClientResponse =
    | Client
    | {
          data: Client;
      };

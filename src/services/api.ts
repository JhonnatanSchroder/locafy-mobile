// src/services/api.ts

import { getToken } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

type ApiOptions = RequestInit & {
    authenticated?: boolean;
};

export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
    status: number;
    errors?: ApiValidationErrors;
    body: unknown;

    constructor({
        message,
        status,
        errors,
        body,
    }: {
        message: string;
        status: number;
        errors?: ApiValidationErrors;
        body: unknown;
    }) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
        this.body = body;
    }
}

export async function api<T>(
    path: string,
    options: ApiOptions = {},
): Promise<T> {
    const {
        authenticated = true,
        headers,
        ...requestOptions
    } = options;

    const token = authenticated
        ? await getToken()
        : null;

    const response = await fetch(`${API_URL}${path}`, {
        ...requestOptions,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
            ...headers,
        },
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const apiBody = body as {
            message?: string;
            errors?: ApiValidationErrors;
        } | null;

        throw new ApiError({
            message:
                apiBody?.message ??
                `Erro na API (${response.status})`,
            status: response.status,
            errors: apiBody?.errors,
            body,
        });
    }

    return body as T;
}

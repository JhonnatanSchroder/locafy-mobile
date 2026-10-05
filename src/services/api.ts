// src/services/api.ts

import { getToken } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

type ApiOptions = RequestInit & {
    authenticated?: boolean;
};

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
        throw new Error(
            body?.message ??
                `Erro na API (${response.status})`,
        );
    }

    return body as T;
}

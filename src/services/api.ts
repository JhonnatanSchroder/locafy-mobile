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

    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let response: Response;
    try {
    response = await fetch(`${API_URL!.replace(/\/$/, '')}${path}`, {
        ...requestOptions,
        signal: controller.signal,
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
    } catch (error) {
        if (controller.signal.aborted) throw new Error('A API demorou para responder. Tente novamente.');
        throw error;
    } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
    }

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

    if (body === null && response.status !== 204) {
        throw new Error('A API retornou uma resposta inválida. Verifique a conexão com o servidor.');
    }
    return body as T;
}

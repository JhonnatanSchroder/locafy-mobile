import { api } from './api';
import {
    removeToken,
    saveToken,
} from './tokenStorage';

import type {
    LoginApiResponse,
    LoginResponse,
    MeApiResponse,
    User,
} from '@/types/auth';

type LoginPayload = {
    token?: string;
    access_token?: string;
    plain_text_token?: string;
    plainTextToken?: string;
    accessToken?: string;
    token_type?: string;
    user?: User;
};

function normalizeLoginResponse(response: LoginApiResponse): LoginResponse {
    const data: LoginPayload = 'data' in response
        ? response.data
        : response;
    const root = response as LoginPayload;

    const token =
        data.token ??
        data.access_token ??
        data.plain_text_token ??
        data.plainTextToken ??
        data.accessToken ??
        root.token ??
        root.access_token ??
        root.plain_text_token ??
        root.plainTextToken ??
        root.accessToken;

    const user = data.user ?? root.user;

    if (!token) {
        throw new Error('Resposta de login sem token.');
    }

    return {
        token,
        token_type: data.token_type ?? root.token_type ?? 'Bearer',
        user,
    };
}

function normalizeMeResponse(response: MeApiResponse): User {
    const user = response && 'data' in response ? response.data : response;
    if (!user || !user.id || typeof user.name !== 'string') {
        throw new Error('GET /me retornou uma sessão inválida.');
    }
    return user;
}

export async function login(
    email: string,
    password: string,
) {
    const response = await api<LoginApiResponse>(
        '/auth/login',
        {
            method: 'POST',
            authenticated: false,
            body: JSON.stringify({
                email,
                password,
                device_name: 'Locafy Mobile',
            }),
        },
    );

    const loginResponse = normalizeLoginResponse(response);

    await saveToken(loginResponse.token);

    return loginResponse;
}

export async function me() {
    const response = await api<MeApiResponse>('/me');

    return normalizeMeResponse(response);
}

export async function logout() {
    try {
        await api('/auth/logout', {
            method: 'POST',
        });
    } finally {
        await removeToken();
    }
}

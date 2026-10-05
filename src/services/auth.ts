import { api } from './api';
import {
    removeToken,
    saveToken,
} from './tokenStorage';

import type {
    LoginApiResponse,
    LoginResponse,
    User,
} from '@/types/auth';

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

    const loginResponse = 'data' in response
        ? response.data
        : response;

    await saveToken(loginResponse.token);

    return loginResponse;
}

export async function me() {
    return api<{ data: User }>('/me');
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

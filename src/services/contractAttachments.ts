import { getToken } from './tokenStorage';
import { ApiError, type ApiValidationErrors } from './api';
import { unwrap } from './resources';
import type { ContractAttachment } from '@/types/contract';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL não foi configurada.');
}

export type LocalContractPhoto = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  fileSize?: number;
};

type AttachmentResponse = ContractAttachment | { data: ContractAttachment };

export async function uploadContractAttachment(contractId: number | string, photo: LocalContractPhoto) {
  const form = new FormData();
  form.append('file', {
    uri: photo.uri,
    name: photo.name,
    type: photo.mimeType,
  } as unknown as Blob);

  return unwrap(await multipart<AttachmentResponse>(`/contracts/${contractId}/attachments`, {
    method: 'POST',
    body: form,
  }));
}

export async function deleteContractAttachment(contractId: number | string, attachmentId: number | string) {
  await multipart<unknown>(`/contracts/${contractId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

async function multipart<T>(path: string, options: RequestInit): Promise<T> {
  const token = await getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${API_URL!.replace(/\/$/, '')}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error('O envio das fotos demorou para responder. Tente novamente.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const apiBody = body as { message?: string; errors?: ApiValidationErrors } | null;
    throw new ApiError({
      message: apiBody?.message ?? `Erro na API (${response.status})`,
      status: response.status,
      errors: apiBody?.errors,
      body,
    });
  }

  return body as T;
}

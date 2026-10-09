import {
  File,
  UploadType,
} from 'expo-file-system';

import { getToken } from './tokenStorage';
import type { ApiValidationErrors } from './api';
import { unwrap } from './resources';
import type { ContractAttachment } from '@/types/contract';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

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

type AttachmentResponse =
  | ContractAttachment[]
  | {
      data: ContractAttachment[];
    };

export class AttachmentUploadError extends Error {
  status?: number;
  statusText?: string;
  errors?: ApiValidationErrors;
  body?: unknown;

  constructor({
    message,
    status,
    statusText,
    errors,
    body,
  }: {
    message: string;
    status?: number;
    statusText?: string;
    errors?: ApiValidationErrors;
    body?: unknown;
  }) {
    super(message);

    this.name = 'AttachmentUploadError';
    this.status = status;
    this.statusText = statusText;
    this.errors = errors;
    this.body = body;
  }
}

/**
 * Faz upload de UMA foto por request.
 *
 * Laravel espera:
 *
 * POST /api/v1/contracts/{contract}/attachments
 *
 * multipart:
 * attachments[] = arquivo
 *
 * Aqui usamos o upload multipart NATIVO do expo-file-system.
 * Não usamos FormData.
 */
export async function uploadContractAttachment(
  contractId: number | string,
  photo: LocalContractPhoto,
  index = 0,
) {
  if (!contractId) {
    throw new AttachmentUploadError({
      message: 'ID do contrato inválido para envio da foto.',
    });
  }

  const normalizedPhoto = normalizePhoto(
    photo,
    contractId,
    index,
  );

  if (
    normalizedPhoto.fileSize != null &&
    normalizedPhoto.fileSize > MAX_ATTACHMENT_BYTES
  ) {
    throw new AttachmentUploadError({
      message: 'Esta foto é maior que 10 MB.',
    });
  }

  const token = await getToken();

  if (__DEV__) {
    console.log('contract attachment upload start', {
      contractId,
      index,
      name: normalizedPhoto.name,
      mimeType: normalizedPhoto.mimeType,
      fileSize: normalizedPhoto.fileSize,
      uriScheme: uriScheme(normalizedPhoto.uri),
    });
  }

  let file: File;

  try {
    file = new File(normalizedPhoto.uri);
  } catch (error) {
    throw new AttachmentUploadError({
      message:
        error instanceof Error
          ? `Não foi possível acessar a foto: ${error.message}`
          : 'Não foi possível acessar a foto selecionada.',
    });
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30_000);

  try {
    const uploadTask = file.createUploadTask(
      `${API_URL!.replace(/\/$/, '')}/contracts/${contractId}/attachments`,
      {
        httpMethod: 'POST',

        uploadType: UploadType.MULTIPART,

        /*
         * IMPORTANTE:
         *
         * O Laravel espera:
         *
         * attachments[]
         *
         * Mesmo enviando apenas uma foto por request,
         * o [] faz o PHP/Laravel interpretá-la como array.
         */
        fieldName: 'attachments[]',

        mimeType: normalizedPhoto.mimeType,

        headers: {
          Accept: 'application/json',

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },

        signal: controller.signal,
      },
    );

    const result = await uploadTask.uploadAsync();

    const body = parseBody(result.body);

    if (__DEV__) {
      console.log('contract attachment upload response', {
        status: result.status,
        body: sanitizeBody(body ?? result.body),
      });
    }

    if (result.status < 200 || result.status >= 300) {
      const apiBody = body as
        | {
            message?: string;
            errors?: ApiValidationErrors;
          }
        | null;

      throw new AttachmentUploadError({
        message: uploadErrorMessage(
          result.status,
          apiBody?.message,
        ),

        status: result.status,
        errors: apiBody?.errors,
        body,
      });
    }

    return unwrap(body as AttachmentResponse);
  } catch (error) {
    if (error instanceof AttachmentUploadError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new AttachmentUploadError({
        message:
          'O envio da foto demorou para responder. Tente novamente.',
      });
    }

    if (__DEV__) {
      console.log(
        'contract attachment upload native error',
        error,
      );
    }

    throw new AttachmentUploadError({
      message:
        error instanceof Error
          ? error.message
          : 'Erro de rede ao enviar foto.',
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Remove attachment.
 *
 * DELETE não envia arquivo, então não precisamos
 * do mecanismo de multipart.
 */
export async function deleteContractAttachment(
  contractId: number | string,
  attachmentId: number | string,
) {
  if (!contractId || !attachmentId) {
    throw new AttachmentUploadError({
      message: 'Contrato ou foto inválidos.',
    });
  }

  const token = await getToken();

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30_000);

  try {
    const response = await fetch(
      `${API_URL!.replace(/\/$/, '')}/contracts/${contractId}/attachments/${attachmentId}`,
      {
        method: 'DELETE',

        signal: controller.signal,

        headers: {
          Accept: 'application/json',

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      },
    );

    const rawBody = await response
      .text()
      .catch(() => '');

    const body = parseBody(rawBody);

    if (!response.ok) {
      const apiBody = body as
        | {
            message?: string;
            errors?: ApiValidationErrors;
          }
        | null;

      throw new AttachmentUploadError({
        message: uploadErrorMessage(
          response.status,
          apiBody?.message,
        ),

        status: response.status,
        statusText: response.statusText,
        errors: apiBody?.errors,
        body,
      });
    }
  } catch (error) {
    if (error instanceof AttachmentUploadError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new AttachmentUploadError({
        message:
          'A remoção da foto demorou para responder. Tente novamente.',
      });
    }

    throw new AttachmentUploadError({
      message:
        error instanceof Error
          ? error.message
          : 'Erro de rede ao remover foto.',
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePhoto(
  photo: LocalContractPhoto,
  contractId: number | string,
  index = 0,
): LocalContractPhoto {
  const mimeType = normalizeMimeType(
    photo.mimeType,
    photo.name,
    photo.uri,
  );

  const extension =
    extensionForMimeType(mimeType) ??
    extensionFromPath(photo.name) ??
    extensionFromPath(photo.uri) ??
    'jpg';

  const name =
    photo.name?.trim() ||
    `contract-${contractId}-${index}.${extension}`;

  return {
    ...photo,
    name,
    mimeType,
  };
}

function normalizeMimeType(
  mimeType: string | undefined,
  name: string,
  uri: string,
) {
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }

  if (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/png' ||
    mimeType === 'image/webp'
  ) {
    return mimeType;
  }

  const extension =
    extensionFromPath(name) ??
    extensionFromPath(uri);

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function extensionForMimeType(
  mimeType: string,
) {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  return null;
}

function extensionFromPath(
  value: string,
) {
  if (!value) {
    return null;
  }

  const clean =
    value.split('?')[0] ?? value;

  const match = clean.match(
    /\.([a-zA-Z0-9]+)$/,
  );

  return (
    match?.[1]?.toLowerCase() ??
    null
  );
}

function uriScheme(
  uri: string,
) {
  return (
    uri.split(':', 1)[0] ||
    'unknown'
  );
}

function parseBody(
  rawBody: string,
) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function sanitizeBody(
  body: unknown,
) {
  if (typeof body === 'string') {
    return body.slice(0, 500);
  }

  return body;
}

function uploadErrorMessage(
  status: number,
  fallback?: string,
) {
  if (status === 401) {
    return (
      fallback ??
      'Sessão expirada ao enviar fotos. Faça login novamente.'
    );
  }

  if (status === 403) {
    return (
      fallback ??
      'Você não tem permissão para enviar fotos neste contrato.'
    );
  }

  if (status === 404) {
    return (
      fallback ??
      'Contrato ou endpoint de fotos não encontrado.'
    );
  }

  if (status === 413) {
    return 'A imagem excede o limite permitido pelo servidor.';
  }

  if (status === 422) {
    return (
      fallback ??
      'O servidor recusou uma das fotos.'
    );
  }

  if (status >= 500) {
    return (
      fallback ??
      'Erro no servidor ao salvar fotos.'
    );
  }

  return (
    fallback ??
    `Erro ao enviar foto (${status}).`
  );
}

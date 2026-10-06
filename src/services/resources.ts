import { api, ApiError } from './api';

export function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? response.data : response as T;
}

// Laravel paginates by 15. Follow page numbers, never server-provided URLs with a token.
export async function allPages<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  let page = 1;
  while (true) {
    const response = await api<T[] | { data: T[]; meta?: { last_page: number }; links?: { next: string | null } }>(`${path}${path.includes('?') ? '&' : '?'}page=${page}`);
    result.push(...unwrap(response));
    if (Array.isArray(response) || (!response.links?.next && page >= (response.meta?.last_page ?? page))) return result;
    page += 1;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errors) return Object.values(error.errors).flat().join('\n') || error.message;
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
}

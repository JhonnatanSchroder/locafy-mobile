// Expo SecureStore has no web implementation. Native resolves tokenStorage.ts.
const TOKEN_KEY = 'locafy_auth_token';

export async function getToken() {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
}
export async function saveToken(token: string) {
  if (typeof window === 'undefined') throw new Error('Armazenamento da sessão indisponível.');
  try { window.localStorage.setItem(TOKEN_KEY, token); }
  catch { throw new Error('Permita o armazenamento deste site para entrar.'); }
}
export async function removeToken() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

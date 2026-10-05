import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginRequest, logout as logoutRequest, me } from '@/services/auth';
import { getToken, removeToken } from '@/services/tokenStorage';
import type { User } from '@/types/auth';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);

      const token = await getToken();

      if (!token) {
        setUser(null);
        return;
      }

      setUser(await me());
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
      await removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);

    const token = await getToken();

    if (!token) {
      throw new Error('Token não foi salvo após o login.');
    }

    setUser(await me());
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      await removeToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      restoreSession,
    }),
    [loading, restoreSession, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
}

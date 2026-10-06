import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginRequest, logout as logoutRequest, me } from '@/services/auth';
import { getToken, removeToken } from '@/services/tokenStorage';
import type { User } from '@/types/auth';
import { ApiError } from '@/services/api';
import { errorMessage } from '@/services/resources';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  sessionError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const token = await getToken();
      setSessionError(null);

      if (!token) {
        setUser(null);
        return;
      }

      setUser(await me());
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        await removeToken();
      } else {
        setSessionError(errorMessage(error));
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    setSessionError(null);
    await loadSession();
  }, [loadSession]);

  useEffect(() => {
    // Restore state from external storage once at startup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSession();
  }, [loadSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setSessionError(null);
    await loginRequest(email, password);

    const token = await getToken();

    if (!token) {
      throw new Error('Token não foi salvo após o login.');
    }

    try {
      setUser(await me());
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) await removeToken();
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      try { await removeToken(); }
      finally { setSessionError(null); setUser(null); }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionError,
      signIn,
      signOut,
      restoreSession,
    }),
    [loading, restoreSession, sessionError, signIn, signOut, user],
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

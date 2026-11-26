import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const sanitizeUser = (raw: unknown): User | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const cdUser = Number(candidate.cd_user);
  const email = typeof candidate.email === 'string' ? candidate.email.trim() : '';

  if (!Number.isInteger(cdUser) || cdUser <= 0 || !email) {
    return null;
  }

  const sanitized: User = {
    cd_user: cdUser,
    email,
  };

  if (typeof candidate.created_at === 'string' && !Number.isNaN(Date.parse(candidate.created_at))) {
    sanitized.created_at = candidate.created_at;
  }

  return sanitized;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('@PernasSolidarias:token');
    if (!savedToken || savedToken === 'undefined' || savedToken === 'null') {
      localStorage.removeItem('@PernasSolidarias:token');
      return null;
    }
    return savedToken;
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('@PernasSolidarias:token');
    localStorage.removeItem('@PernasSolidarias:user');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('@PernasSolidarias:token');
      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        try {
          const { user: fetchedUser } = await authService.me();
          const validUser = sanitizeUser(fetchedUser);
          if (validUser) {
            setUser(validUser);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    };

    void checkAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    const validUser = sanitizeUser(res?.user);
    if (!res || typeof res.token !== 'string' || !res.token || !validUser) {
      throw new Error('Resposta de autenticação inválida.');
    }
    localStorage.setItem('@PernasSolidarias:token', res.token);
    setToken(res.token);
    setUser(validUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

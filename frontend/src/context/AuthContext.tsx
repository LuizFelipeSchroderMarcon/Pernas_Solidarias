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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('@PernasSolidarias:user');
      if (!savedUser || savedUser === 'undefined' || savedUser === 'null') {
        localStorage.removeItem('@PernasSolidarias:user');
        return null;
      }
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('@PernasSolidarias:user');
      return null;
    }
  });

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
          const { user } = await authService.me();
          if (user) {
            setUser(user);
            localStorage.setItem('@PernasSolidarias:user', JSON.stringify(user));
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

    checkAuth();

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
    if (!res || !res.token || !res.user) {
      throw new Error('Resposta de autenticação inválida.');
    }
    localStorage.setItem('@PernasSolidarias:token', res.token);
    localStorage.setItem('@PernasSolidarias:user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
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

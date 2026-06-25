import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('filmelo_token');
      if (token) {
        try {
          const res = await authApi.me();
          setUser(res.data.user);
        } catch {
          localStorage.removeItem('filmelo_token');
          localStorage.removeItem('filmelo_user');
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data;
    localStorage.setItem('filmelo_token', token);
    localStorage.setItem('filmelo_user', JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('filmelo_token');
    localStorage.removeItem('filmelo_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('filmelo_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

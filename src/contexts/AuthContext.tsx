'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenService } from '@/lib/api-client';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = TokenService.getAccessToken();
    const isValid = TokenService.isTokenValid();
    setIsAuthenticated(!!token && isValid);
    setIsLoading(false);
  }, []);

  const login = (tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => {
    TokenService.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    setIsAuthenticated(true);
  };

  const logout = () => {
    TokenService.clearTokens();
    setIsAuthenticated(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
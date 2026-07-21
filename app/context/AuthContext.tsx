'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { apiFetch, getAuthToken, removeAuthToken, setAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  setUserProfile: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => { },
  logout: async () => { },
  setUserProfile: () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getAuthToken();
    if (storedToken) {
      setTokenState(storedToken);
      // Fetch initial current user profile or mock default admin session
      setUser({
        id: 1,
        username: 'admin',
        full_name: 'System Admin',
        role: 'admin',
        email: 'admin@sapaai.com',
        phone: '+628123456789',
        photo_url: null,
        is_active: true,
      });
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
      } catch (err) {
        console.warn('Logout endpoint failed or server unreachable:', err);
      }
    }
    removeAuthToken();
    setTokenState(null);
    setUser(null);
  };

  const setUserProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

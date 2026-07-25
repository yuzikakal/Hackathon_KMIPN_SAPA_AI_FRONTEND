'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { apiFetch, getAuthToken, getStoredUser, removeAuthToken, removeStoredUser, setAuthToken, setStoredUser } from '../lib/api';
import { wsClient } from '../lib/wsclient';

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
    const storedUser = getStoredUser();
    if (storedToken) {
      setTokenState(storedToken);
      if (storedUser) {
        setUser(storedUser);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    if (wsClient) {
      wsClient.disconnect();
    }
    if (token) {
      try {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
      } catch (err) {
        console.warn('Logout endpoint failed or server unreachable:', err);
      }
    }
    removeAuthToken();
    removeStoredUser();
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

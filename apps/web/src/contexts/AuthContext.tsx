import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthQuery } from '../hooks/useAuthQuery';
import type { User, SignupData, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (data: SignupData) => Promise<AuthResponse>;
  logout: () => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading, login, signup, logout } = useAuthQuery();

  const loginHandler = async (email: string, password: string) => {
    return login({ email, password });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginHandler, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

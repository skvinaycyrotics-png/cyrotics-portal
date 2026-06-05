'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { ApiError } from '@/lib/api';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'client' | 'guest';

export interface DashboardConfig {
  showProjects: boolean;
  showTickets: boolean;
  showDocuments: boolean;
  showAnnouncements: boolean;
  customMessage?: string;
  accentColor: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  designation?: string;
  role: UserRole;
  status: string;
  twoFactorEnabled: boolean;
  lastLogin?: string;
  dashboardConfig: DashboardConfig;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requiresTwoFactor?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isClient: boolean;
  isAuthenticated: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const router = useRouter();

  // ── Load current user on mount ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{ data: { user: AuthUser } }>('/auth/me');
      setState({ user: data.data.user, loading: false, error: null });
    } catch {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, twoFactorCode?: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.post<{ requiresTwoFactor?: boolean; data?: { user: AuthUser } }>(
        '/auth/login', { email, password, twoFactorCode }
      );
      if (data.requiresTwoFactor) {
        setState(s => ({ ...s, loading: false }));
        return { requiresTwoFactor: true };
      }
      setState({ user: data.data!.user, loading: false, error: null });
      return {};
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed.';
      setState(s => ({ ...s, loading: false, error: msg }));
      throw err;
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setState({ user: null, loading: false, error: null });
    router.push('/login');
  };

  const clearError = () => setState(s => ({ ...s, error: null }));

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
    isAdmin: state.user?.role === 'admin',
    isClient: state.user?.role === 'client',
    isAuthenticated: !!state.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

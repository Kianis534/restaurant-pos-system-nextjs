'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import { storage, toPublicUser } from '@/lib/storage';
import { verifyPassword } from '@/lib/password';

interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  /** True until stored data has been loaded and the saved session checked. */
  isLoading: boolean;
  login: (employeeNo: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  /** Re-reads the signed-in user, e.g. after an admin edits their own account. */
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function homePathFor(role: Role): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'kitchen') return '/kitchen';
  return '/cashier/dashboard';
}

function userFromSession(): User | null {
  const session = storage.getSession();
  if (!session) return null;
  const stored = storage.getUsers().find((u) => u.id === session.userId);
  if (!stored) {
    storage.setSession(null); // the account was deleted
    return null;
  }
  return toPublicUser(stored);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    storage
      .initialize()
      .catch((error) => console.error('Could not prepare local data', error))
      .finally(() => {
        if (cancelled) return;
        setUser(userFromSession());
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Signing out in another tab signs out here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'pos_session' || event.key === 'pos_users') setUser(userFromSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (employeeNo: string, password: string): Promise<LoginResult> => {
    const invalid = { success: false, message: 'Invalid employee number or password.' };
    const stored = storage.getUsers().find((u) => u.employeeNo.toLowerCase() === employeeNo.trim().toLowerCase());
    if (!stored || !(await verifyPassword(password, stored.passwordHash))) return invalid;
    const publicUser = toPublicUser(stored);
    storage.setSession({ userId: stored.id });
    setUser(publicUser);
    return { success: true, user: publicUser };
  }, []);

  const logout = useCallback(() => {
    storage.setSession(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => setUser(userFromSession()), []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

'use client';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from './AdminLayout';
import { CashierLayout } from './CashierLayout';

/** For pages both admins and cashiers use: each sees their own navigation. */
export function RoleLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminLayout>{children}</AdminLayout> : <CashierLayout>{children}</CashierLayout>;
}

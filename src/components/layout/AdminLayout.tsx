'use client';
import type { ReactNode } from 'react';
import { BadgePercent, BarChart3, LayoutDashboard, Settings, SquareStack, UtensilsCrossed, Users } from 'lucide-react';
import { AppShell, type NavLink } from './AppShell';

export const adminLinks: NavLink[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/tables', label: 'Tables', icon: SquareStack },
  { href: '/admin/discounts', label: 'Discounts', icon: BadgePercent },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell homeHref="/admin/dashboard" links={adminLinks}>
      {children}
    </AppShell>
  );
}

'use client';
import type { ReactNode } from 'react';
import { ChefHat, FileText, LayoutDashboard, Package, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, type NavLink } from './AppShell';

const cashierLinks: NavLink[] = [
  { href: '/cashier/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cashier/dine-in', label: 'Dine-in', icon: UtensilsCrossed },
  { href: '/cashier/takeaway', label: 'Takeaway', icon: Package },
  { href: '/cashier/bills', label: 'Bills', icon: FileText },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
];

/** POS screens. Admins can use them too and get a link back to the back office. */
export function CashierLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const links =
    user?.role === 'admin' ? [...cashierLinks, { href: '/admin/dashboard', label: 'Back office', icon: ShieldCheck }] : cashierLinks;
  return (
    <AppShell homeHref="/cashier/dashboard" links={links}>
      {children}
    </AppShell>
  );
}

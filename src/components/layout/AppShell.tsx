'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';
import { capitalize } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Strips the trailing slash that `trailingSlash: true` adds, so links highlight correctly. */
function isActive(pathname: string, href: string): boolean {
  const current = pathname.replace(/\/$/, '') || '/';
  return current === href || current.startsWith(`${href}/`);
}

export function AppShell({ homeHref, links, children }: { homeHref: string; links: NavLink[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100">
      <header className="no-print sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-blue-600" /> {config.appName}
              </SheetTitle>
              <nav className="mt-2 grid gap-1 text-base font-medium" aria-label="Main">
                {links.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2',
                      isActive(pathname, href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href={homeHref} className="flex shrink-0 items-center gap-2 font-semibold text-gray-900">
            <UtensilsCrossed className="h-6 w-6 text-blue-600" />
            <span className="hidden sm:inline">{config.appName}</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 text-sm font-medium lg:flex" aria-label="Main">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-2 transition-colors',
                  isActive(pathname, href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="hidden text-right leading-tight md:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{capitalize(user.role)}</p>
              </div>
            )}
            <Button onClick={logout} variant="outline" size="sm" aria-label="Log out">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex w-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}

'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/Sheet';
import { Menu, Package2, Home, ShoppingCart, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation'; 
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react'; 

export function CashierLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: authLoading } = useAuth(); 
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);


  const navLinks = [
    { href: '/cashier/dashboard', label: 'Dashboard', icon: Home },
    { href: '/cashier/dine-in', label: 'Dine-in', icon: ShoppingCart },
    { href: '/cashier/walk-in-take-away', label: 'Walk-in / Take Away', icon: ShoppingCart },
    { href: '/cashier/previous-bills', label: 'Previous Bills', icon: FileText },
  ];

  if (authLoading || !user) { 
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="/cashier/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base text-gray-900">
            <Package2 className="h-6 w-6" />
            <span className="sr-only">Cashier Dashboard</span>
          </Link>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap transition-colors hover:text-gray-900 ${pathname === href ? 'text-gray-900' : 'text-gray-500'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="#" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package2 className="h-6 w-6" />
                <span className="sr-only">Cashier Dashboard</span>
              </Link>
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-4 px-2.5 ${pathname === href ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial">
            <span className="text-gray-700">Welcome, {user.name}</span>
          </div>
          <Button onClick={logout} variant="destructive">
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
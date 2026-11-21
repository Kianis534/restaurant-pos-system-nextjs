'use client';
import { useEffect, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { Role } from '@/types';
import { FullPageSpinner } from '@/components/ui/Spinner';

/**
 * Client-side route guard. Sends signed-out visitors to /login and the wrong role to
 * /unauthorized. This is a UI guard only: everything runs in the browser, so it keeps
 * honest users on the right screens but it is not a security boundary (see README).
 */
export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>, allowedRoles: Role[]) {
  function WithAuth(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const allowed = !!user && allowedRoles.includes(user.role);

    useEffect(() => {
      if (isLoading) return;
      if (!user) router.replace('/login');
      else if (!allowedRoles.includes(user.role)) router.replace('/unauthorized');
    }, [user, isLoading, router]);

    if (isLoading || !allowed) return <FullPageSpinner />;
    return <WrappedComponent {...props} />;
  }
  WithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithAuth;
}

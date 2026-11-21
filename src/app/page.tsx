'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { homePathFor, useAuth } from '@/contexts/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) router.replace(user ? homePathFor(user.role) : '/login');
  }, [user, isLoading, router]);

  return <FullPageSpinner />;
}

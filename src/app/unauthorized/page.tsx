'use client';
import { Lock } from 'lucide-react';
import { homePathFor, useAuth } from '@/contexts/AuthContext';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <Lock className="h-12 w-12 text-red-500" aria-hidden="true" />
          <CardTitle className="text-2xl text-red-600">Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">Your account doesn&apos;t have permission to open that page.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton href={user ? homePathFor(user.role) : '/login'}>Go to my home screen</LinkButton>
            {user && (
              <Button variant="outline" onClick={logout}>
                Sign in as someone else
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import { homePathFor, useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';
import { DEMO_ACCOUNTS } from '@/lib/seed';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(homePathFor(user.role));
  }, [user, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!employeeNo.trim() || !password) {
      setError('Enter your employee number and password.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await login(employeeNo, password);
      if (!result.success) setError(result.message ?? 'Sign-in failed.');
      // On success the effect above redirects.
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (no: string, pass: string) => {
    setEmployeeNo(no);
    setPassword(pass);
    setError('');
  };

  if (isLoading || user) return <FullPageSpinner />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <UtensilsCrossed className="mb-1 h-10 w-10 text-blue-600" aria-hidden="true" />
          <CardTitle className="text-2xl">{config.appName}</CardTitle>
          <CardDescription>Sign in with your employee number</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Employee number" htmlFor="employeeNo">
              <Input
                id="employeeNo"
                autoComplete="username"
                autoCapitalize="none"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
        {config.showDemoAccounts && (
          <CardFooter className="flex-col items-stretch gap-2 border-t border-gray-100 pt-4 text-sm">
            <p className="text-center text-gray-600">Demo accounts (tap to fill in):</p>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.employeeNo}
                  type="button"
                  onClick={() => fillDemo(account.employeeNo, account.password)}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{account.role}</span>
                  <span className="font-mono text-xs text-gray-600">
                    {account.employeeNo} / {account.password}
                  </span>
                </button>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

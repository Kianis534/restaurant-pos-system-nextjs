'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [passwordWarning, setPasswordWarning] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/cashier/dashboard');
    }
  }, [user, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword.includes(' ')) {
      setPasswordWarning('Password should not contain spaces.');
    } else {
      setPasswordWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(employeeNo.trim(), password);
    
    if (result.success && result.user) {
      router.push(result.user.role === 'admin' ? '/admin/dashboard' : '/cashier/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Restaurant POS</CardTitle>
          <CardDescription className="text-center">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="employeeNo"
                type="text"
                placeholder="Employee Number"
                required
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={handlePasswordChange}
              />
              {passwordWarning && (
                <p className="text-sm text-red-600">{passwordWarning}</p>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center text-sm text-gray-600">
          <p>
            Demo Accounts:<br />
            Admin: admin001 / admin123<br />
            Cashier: cashier001 / cashier123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
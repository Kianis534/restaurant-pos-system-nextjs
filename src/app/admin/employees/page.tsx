'use client';
import { useMemo, useState } from 'react';
import { Edit, PlusCircle, Search, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { capitalize } from '@/lib/format';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge, PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const NO_USERS: User[] = [];
const ROLE_TONE = { admin: 'blue', cashier: 'green', kitchen: 'amber' } as const;

function EmployeesPage() {
  const { user: me } = useAuth();
  const users = useStoredData('publicUsers', () => storage.getPublicUsers(), NO_USERS);
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => !term || u.name.toLowerCase().includes(term) || u.employeeNo.toLowerCase().includes(term));
  }, [users, search]);

  const remove = (user: User) => {
    if (user.id === me?.id) return alert("You can't delete the account you're signed in with.");
    if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length === 1) {
      return alert("You can't delete the only admin.");
    }
    if (!window.confirm(`Delete ${user.name} (${user.employeeNo})? They will no longer be able to sign in.`)) return;
    storage.saveUsers(storage.getUsers().filter((u) => u.id !== user.id));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Employees"
        description="Staff accounts and what they can access."
        actions={
          <LinkButton href="/admin/employees/new">
            <PlusCircle className="h-4 w-4" /> New employee
          </LinkButton>
        }
      />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Search by name or employee number"
          aria-label="Search employees"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Card>
        <CardContent className="pt-2 sm:pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee no.</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === me?.id && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{u.employeeNo}</TableCell>
                  <TableCell>
                    <Badge tone={ROLE_TONE[u.role]}>{capitalize(u.role)}</Badge>
                  </TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{u.phone || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <LinkButton href={`/admin/employees/edit?id=${encodeURIComponent(u.id)}`} variant="ghost" size="iconSm" aria-label={`Edit ${u.name}`}>
                      <Edit className="h-4 w-4" />
                    </LinkButton>
                    <Button variant="ghost" size="iconSm" onClick={() => remove(u)} aria-label={`Delete ${u.name}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && <TableEmpty colSpan={6}>No employees match.</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(EmployeesPage, ['admin']);

'use client';
import { useState, useEffect, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
import { User } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';

function EmployeeManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const storage = new StorageService();

  useEffect(() => {
    setUsers(storage.getUsers());
    setIsLoading(false);
  }, []);

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <Link href="/admin/employees/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Employee
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search employees by name..."
                className="pl-8 w-full max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-900">Name</TableHead>
                <TableHead className="text-gray-900">Employee No</TableHead>
                <TableHead className="text-gray-900">Role</TableHead>
                <TableHead className="text-gray-900">Email</TableHead>
                <TableHead className="text-gray-900">Phone</TableHead>
                <TableHead className="text-right text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                  <TableCell className="text-gray-900">{user.employeeNo}</TableCell>
                  <TableCell className="text-gray-900">{user.role}</TableCell>
                  <TableCell className="text-gray-900">{user.email}</TableCell>
                  <TableCell className="text-gray-900">{user.phone}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/employees/edit/${user.id}`}>
                      <Button variant="ghost" size="sm" className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(EmployeeManagement, ['admin']);
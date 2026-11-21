'use client';
import type { User } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmployeeForm } from '@/components/admin/EmployeeForm';
import { MissingRecord } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_USERS: User[] = [];

function EditEmployeePage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const users = useStoredData('publicUsers', () => storage.getPublicUsers(), NO_USERS);
  const employee = users.find((u) => u.id === id);
  return (
    <AdminLayout>
      <PageHeader title="Edit employee" backHref="/admin/employees" />
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : employee ? (
        <EmployeeForm key={employee.id} employee={employee} />
      ) : (
        <MissingRecord what="employee" backHref="/admin/employees" backLabel="Back to employees" />
      )}
    </AdminLayout>
  );
}

export default withAuth(EditEmployeePage, ['admin']);

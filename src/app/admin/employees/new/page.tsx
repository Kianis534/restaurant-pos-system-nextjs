'use client';
import withAuth from '@/components/auth/withAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmployeeForm } from '@/components/admin/EmployeeForm';
import { PageHeader } from '@/components/ui/PageHeader';

function NewEmployeePage() {
  return (
    <AdminLayout>
      <PageHeader title="New employee" backHref="/admin/employees" />
      <EmployeeForm />
    </AdminLayout>
  );
}

export default withAuth(NewEmployeePage, ['admin']);

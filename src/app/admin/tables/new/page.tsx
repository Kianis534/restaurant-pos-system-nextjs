'use client';
import type { Area, Table } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TableForm } from '@/components/admin/TableForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_AREAS: Area[] = [];
const NO_TABLES: Table[] = [];

function NewTablePage() {
  const hydrated = useHydrated();
  const areas = useStoredData('areas', () => storage.getAreas(), NO_AREAS);
  const tables = useStoredData('tables', () => storage.getTables(), NO_TABLES);
  return (
    <AdminLayout>
      <PageHeader title="New table" backHref="/admin/tables" />
      {hydrated ? <TableForm areas={areas} tables={tables} /> : <Spinner className="mx-auto" />}
    </AdminLayout>
  );
}

export default withAuth(NewTablePage, ['admin']);

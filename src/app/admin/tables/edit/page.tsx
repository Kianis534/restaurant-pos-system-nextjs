'use client';
import type { Area, Table } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { TableForm } from '@/components/admin/TableForm';
import { MissingRecord } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_AREAS: Area[] = [];
const NO_TABLES: Table[] = [];

function EditTablePage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const areas = useStoredData('areas', () => storage.getAreas(), NO_AREAS);
  const tables = useStoredData('tables', () => storage.getTables(), NO_TABLES);
  const table = tables.find((t) => t.id === id);
  return (
    <AdminLayout>
      <PageHeader title={table ? `Edit table ${table.name}` : 'Edit table'} backHref="/admin/tables" />
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : table ? (
        <TableForm key={table.id} table={table} areas={areas} tables={tables} />
      ) : (
        <MissingRecord what="table" backHref="/admin/tables" backLabel="Back to tables" />
      )}
    </AdminLayout>
  );
}

export default withAuth(EditTablePage, ['admin']);

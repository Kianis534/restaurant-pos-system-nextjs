'use client';
import type { Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DealForm } from '@/components/admin/DealForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_PRODUCTS: Product[] = [];

function NewDealPage() {
  const hydrated = useHydrated();
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  return (
    <AdminLayout>
      <PageHeader title="New deal" description="Bundle items together at a set price." backHref="/admin/products" />
      {hydrated ? <DealForm products={products} /> : <Spinner className="mx-auto" />}
    </AdminLayout>
  );
}

export default withAuth(NewDealPage, ['admin']);

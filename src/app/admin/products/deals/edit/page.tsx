'use client';
import type { Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DealForm } from '@/components/admin/DealForm';
import { MissingRecord } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_PRODUCTS: Product[] = [];

function EditDealPage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const deal = products.find((p) => p.id === id && p.isDeal);
  return (
    <AdminLayout>
      <PageHeader title="Edit deal" backHref="/admin/products" />
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : deal ? (
        <DealForm key={deal.id} deal={deal} products={products} />
      ) : (
        <MissingRecord what="deal" backHref="/admin/products" backLabel="Back to the menu" />
      )}
    </AdminLayout>
  );
}

export default withAuth(EditDealPage, ['admin']);

'use client';
import type { Category, Product, Settings } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { seedSettings } from '@/lib/seed';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProductForm } from '@/components/admin/ProductForm';
import { MissingRecord } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_CATEGORIES: Category[] = [];
const DEFAULT_SETTINGS: Settings = seedSettings();

function EditProductPage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const product = useStoredData<Product | null>(
    `product:${id}`,
    () => storage.getProducts().find((p) => p.id === id && !p.isDeal) ?? null,
    null,
  );
  const categories = useStoredData('categories', () => storage.getCategories(), NO_CATEGORIES);
  const settings = useStoredData('settings', () => storage.getSettings(), DEFAULT_SETTINGS);

  return (
    <AdminLayout>
      <PageHeader title="Edit menu item" backHref="/admin/products" />
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : product ? (
        <ProductForm key={product.id} product={product} categories={categories} settings={settings} />
      ) : (
        <MissingRecord what="menu item" backHref="/admin/products" backLabel="Back to the menu" />
      )}
    </AdminLayout>
  );
}

export default withAuth(EditProductPage, ['admin']);

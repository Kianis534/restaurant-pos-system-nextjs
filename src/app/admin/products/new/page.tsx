'use client';
import type { Category, Settings } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { seedSettings } from '@/lib/seed';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProductForm } from '@/components/admin/ProductForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_CATEGORIES: Category[] = [];
const DEFAULT_SETTINGS: Settings = seedSettings();

function NewProductPage() {
  const hydrated = useHydrated();
  const categories = useStoredData('categories', () => storage.getCategories(), NO_CATEGORIES);
  const settings = useStoredData('settings', () => storage.getSettings(), DEFAULT_SETTINGS);
  return (
    <AdminLayout>
      <PageHeader title="New menu item" backHref="/admin/products" />
      {hydrated ? <ProductForm categories={categories} settings={settings} /> : <Spinner className="mx-auto" />}
    </AdminLayout>
  );
}

export default withAuth(NewProductPage, ['admin']);

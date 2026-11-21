'use client';
import type { Category, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DiscountForm } from '@/components/admin/DiscountForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: Category[] = [];

function NewDiscountPage() {
  const hydrated = useHydrated();
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const categories = useStoredData('categories', () => storage.getCategories(), NO_CATEGORIES);
  return (
    <AdminLayout>
      <PageHeader title="New discount" backHref="/admin/discounts" />
      {hydrated ? <DiscountForm products={products} categories={categories} /> : <Spinner className="mx-auto" />}
    </AdminLayout>
  );
}

export default withAuth(NewDiscountPage, ['admin']);

'use client';
import type { Category, Discount, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DiscountForm } from '@/components/admin/DiscountForm';
import { MissingRecord } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: Category[] = [];
const NO_DISCOUNTS: Discount[] = [];

function EditDiscountPage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const categories = useStoredData('categories', () => storage.getCategories(), NO_CATEGORIES);
  const discounts = useStoredData('discounts', () => storage.getDiscounts(), NO_DISCOUNTS);
  const discount = discounts.find((d) => d.id === id);
  return (
    <AdminLayout>
      <PageHeader title="Edit discount" backHref="/admin/discounts" />
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : discount ? (
        <DiscountForm key={discount.id} discount={discount} products={products} categories={categories} />
      ) : (
        <MissingRecord what="discount" backHref="/admin/discounts" backLabel="Back to discounts" />
      )}
    </AdminLayout>
  );
}

export default withAuth(EditDiscountPage, ['admin']);

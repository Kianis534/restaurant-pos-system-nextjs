'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { Edit, PlusCircle, Search, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Category, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { formatMoney } from '@/lib/format';
import { validateName } from '@/lib/validation';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge, PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const NO_PRODUCTS: Product[] = [];
const NO_CATEGORIES: Category[] = [];

function MenuPage() {
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const categories = useStoredData('categories', () => storage.getCategories(), NO_CATEGORIES);
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const items = useMemo(
    () => products.filter((p) => !p.isDeal && (!term || p.name.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term))),
    [products, term],
  );
  const deals = useMemo(() => products.filter((p) => p.isDeal && (!term || p.name.toLowerCase().includes(term))), [products, term]);
  const nameOf = (id: string) => products.find((p) => p.id === id)?.name;

  const deleteProduct = (product: Product) => {
    const usedIn = products.filter((p) => p.isDeal && p.dealItems?.includes(product.id));
    const warning = usedIn.length ? `\n\nIt will also be taken out of: ${usedIn.map((d) => d.name).join(', ')}.` : '';
    if (!window.confirm(`Delete "${product.name}"?${warning}`)) return;
    const settings = storage.getSettings();
    storage.saveProducts(
      products
        .filter((p) => p.id !== product.id)
        .map((p) => (p.isDeal && p.dealItems?.includes(product.id) ? { ...p, dealItems: p.dealItems.filter((id) => id !== product.id) } : p)),
    );
    storage.saveSettings({ ...settings, taxExemptProductIds: settings.taxExemptProductIds.filter((id) => id !== product.id) });
    storage.saveDiscounts(storage.getDiscounts().filter((d) => !(d.type === 'item' && d.target === product.id)));
  };

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateName(newCategory, categories, 'Category');
    setCategoryError(problem);
    if (problem) return;
    storage.saveCategories([...categories, { id: uuidv4(), name: newCategory.trim() }]);
    setNewCategory('');
  };

  const deleteCategory = (category: Category) => {
    const count = products.filter((p) => p.category === category.name).length;
    const note = count ? ` ${count} item(s) will become uncategorised.` : '';
    if (!window.confirm(`Delete the "${category.name}" category?${note}`)) return;
    storage.saveProducts(products.map((p) => (p.category === category.name ? { ...p, category: '' } : p)));
    storage.saveCategories(categories.filter((c) => c.id !== category.id));
    storage.saveDiscounts(storage.getDiscounts().filter((d) => !(d.type === 'category' && d.target === category.name)));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Menu"
        description="Items, deals and categories."
        actions={
          <>
            <LinkButton href="/admin/products/new">
              <PlusCircle className="h-4 w-4" /> New item
            </LinkButton>
            <LinkButton href="/admin/products/deals/new" variant="outline">
              <PlusCircle className="h-4 w-4" /> New deal
            </LinkButton>
          </>
        }
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Search by name or SKU"
          aria-label="Search the menu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                    {p.sku && <span className="block text-xs text-gray-500">{p.sku}</span>}
                  </TableCell>
                  <TableCell>{p.category || <span className="text-gray-400">None</span>}</TableCell>
                  <TableCell className="text-right">{formatMoney(p.price)}</TableCell>
                  <TableCell className="text-right">{formatMoney(p.cost)}</TableCell>
                  <TableCell className="text-right">
                    {p.quantity <= 0 ? <Badge tone="red">Out</Badge> : p.quantity <= 10 ? <Badge tone="amber">{p.quantity}</Badge> : p.quantity}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <LinkButton href={`/admin/products/edit?id=${encodeURIComponent(p.id)}`} variant="ghost" size="iconSm" aria-label={`Edit ${p.name}`}>
                      <Edit className="h-4 w-4" />
                    </LinkButton>
                    <Button variant="ghost" size="iconSm" onClick={() => deleteProduct(p)} aria-label={`Delete ${p.name}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableEmpty colSpan={6}>{term ? 'No items match.' : 'No items yet.'}</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Includes</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-gray-600">{(d.dealItems ?? []).map(nameOf).filter(Boolean).join(', ') || '-'}</TableCell>
                  <TableCell className="text-right">{formatMoney(d.price)}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <LinkButton href={`/admin/products/deals/edit?id=${encodeURIComponent(d.id)}`} variant="ghost" size="iconSm" aria-label={`Edit ${d.name}`}>
                      <Edit className="h-4 w-4" />
                    </LinkButton>
                    <Button variant="ghost" size="iconSm" onClick={() => deleteProduct(d)} aria-label={`Delete ${d.name}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {deals.length === 0 && <TableEmpty colSpan={4}>{term ? 'No deals match.' : 'No deals yet.'}</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addCategory} className="flex max-w-md gap-2" noValidate>
            <Input
              placeholder="New category name"
              aria-label="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              aria-invalid={!!categoryError}
            />
            <Button type="submit">
              <PlusCircle className="h-4 w-4" /> Add
            </Button>
          </form>
          {categoryError && (
            <p className="text-sm text-red-600" role="alert">
              {categoryError}
            </p>
          )}
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1 text-sm">
                {c.name}
                <span className="text-xs text-gray-500">({products.filter((p) => p.category === c.name).length})</span>
                <button
                  type="button"
                  onClick={() => deleteCategory(c)}
                  className="rounded-full p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete category ${c.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {categories.length === 0 && <li className="text-sm text-gray-500">No categories yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(MenuPage, ['admin']);

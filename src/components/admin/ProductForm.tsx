'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Category, Product, Settings } from '@/types';
import { storage } from '@/lib/storage';
import { unitPrice } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { validateProduct, type Errors } from '@/lib/validation';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  settings: Settings;
}

export function ProductForm({ product, categories, settings }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: product?.name ?? '',
    category: product?.category ?? categories[0]?.name ?? '',
    price: product ? String(product.price) : '',
    cost: product ? String(product.cost) : '',
    quantity: product ? String(product.quantity) : '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const preview = Number(values.price) >= 0
    ? unitPrice(
        { id: product?.id ?? '__new__', name: values.name, category: values.category, price: Number(values.price) || 0, cost: 0, quantity: 0 },
        { taxRate: settings.taxRate, taxExemptProductIds: settings.taxExemptProductIds, discounts: [] },
      )
    : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const all = storage.getProducts();
    const others = all.filter((p) => p.id !== product?.id);
    const problems = validateProduct(values, others);
    setErrors(problems);
    if (Object.keys(problems).length) return;

    const saved: Product = {
      ...(product ?? {}),
      id: product?.id ?? uuidv4(),
      name: values.name.trim(),
      category: values.category,
      price: Number(values.price),
      cost: Number(values.cost),
      quantity: Number(values.quantity),
      ...(values.sku.trim() ? { sku: values.sku.trim() } : { sku: undefined }),
      ...(values.description.trim() ? { description: values.description.trim() } : { description: undefined }),
    };
    storage.saveProducts(product ? all.map((p) => (p.id === product.id ? saved : p)) : [...all, saved]);
    router.push('/admin/products');
  };

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name}>
              <Input id="name" value={values.name} onChange={set('name')} aria-invalid={!!errors.name} required />
            </Field>
            <Field label="Category" htmlFor="category" hint={categories.length === 0 ? 'Add categories on the Menu page.' : undefined}>
              <Select id="category" value={values.category} onChange={set('category')}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Price (before tax)"
              htmlFor="price"
              error={errors.price}
              hint={preview ? `Customers pay ${formatMoney(preview.unitTotal)} with tax.` : undefined}
            >
              <Input id="price" type="number" inputMode="decimal" min="0" step="0.01" value={values.price} onChange={set('price')} aria-invalid={!!errors.price} required />
            </Field>
            <Field label="Cost" htmlFor="cost" error={errors.cost} hint="What the item costs you to make.">
              <Input id="cost" type="number" inputMode="decimal" min="0" step="0.01" value={values.cost} onChange={set('cost')} aria-invalid={!!errors.cost} required />
            </Field>
            <Field label="Stock" htmlFor="quantity" error={errors.quantity}>
              <Input id="quantity" type="number" inputMode="numeric" min="0" step="1" value={values.quantity} onChange={set('quantity')} aria-invalid={!!errors.quantity} required />
            </Field>
            <Field label="SKU (optional)" htmlFor="sku" error={errors.sku}>
              <Input id="sku" value={values.sku} onChange={set('sku')} aria-invalid={!!errors.sku} />
            </Field>
            <Field label="Description (optional)" htmlFor="description" className="md:col-span-2">
              <Textarea id="description" value={values.description} onChange={set('description')} rows={3} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <LinkButton href="/admin/products" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit">{product ? 'Save changes' : 'Add item'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ReactSelect from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '@/types';
import { storage } from '@/lib/storage';
import { formatMoney } from '@/lib/format';
import { validateDeal, type Errors } from '@/lib/validation';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Field, Label } from '@/components/ui/Label';

type Option = { value: string; label: string };

export function DealForm({ deal, products }: { deal?: Product; products: Product[] }) {
  const router = useRouter();
  const items = products.filter((p) => !p.isDeal);
  const options: Option[] = items.map((p) => ({ value: p.id, label: `${p.name} (${formatMoney(p.price)})` }));
  const [name, setName] = useState(deal?.name ?? '');
  const [price, setPrice] = useState(deal ? String(deal.price) : '');
  const [selected, setSelected] = useState<string[]>(deal?.dealItems?.filter((id) => items.some((p) => p.id === id)) ?? []);
  const [errors, setErrors] = useState<Errors>({});

  const separateTotal = selected.reduce((sum, id) => sum + (items.find((p) => p.id === id)?.price ?? 0), 0);
  const savings = separateTotal - Number(price || 0);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const all = storage.getProducts();
    const problems = validateDeal({ name, price, items: selected }, all.filter((p) => p.id !== deal?.id));
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const saved: Product = {
      id: deal?.id ?? uuidv4(),
      name: name.trim(),
      category: 'Deals',
      price: Number(price),
      cost: 0,
      quantity: 0,
      isDeal: true,
      dealItems: selected,
    };
    storage.saveProducts(deal ? all.map((p) => (p.id === deal.id ? saved : p)) : [...all, saved]);
    router.push('/admin/products');
  };

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Deal name" htmlFor="name" error={errors.name}>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} required />
            </Field>
            <Field
              label="Deal price (before tax)"
              htmlFor="price"
              error={errors.price}
              hint={
                selected.length > 0
                  ? `Bought separately: ${formatMoney(separateTotal)}${savings > 0 ? ` · customer saves ${formatMoney(savings)}` : ''}`
                  : undefined
              }
            >
              <Input id="price" type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!errors.price} required />
            </Field>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="deal-items">Items in the deal</Label>
              <ReactSelect<Option, true>
                inputId="deal-items"
                instanceId="deal-items"
                isMulti
                options={options}
                value={options.filter((o) => selected.includes(o.value))}
                onChange={(next) => setSelected(next.map((o) => o.value))}
                classNamePrefix="rs"
                placeholder="Pick two or more items..."
              />
              {errors.items ? (
                <p className="text-sm text-red-600" role="alert">
                  {errors.items}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Selling the deal takes one of each item out of stock.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <LinkButton href="/admin/products" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit">{deal ? 'Save changes' : 'Add deal'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

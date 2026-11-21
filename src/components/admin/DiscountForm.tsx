'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Category, Discount, DiscountType, Product } from '@/types';
import { storage } from '@/lib/storage';
import { todayLocal } from '@/lib/format';
import { validateDiscount, type Errors } from '@/lib/validation';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';

const TYPES: { value: DiscountType; label: string }[] = [
  { value: 'all', label: 'Whole menu' },
  { value: 'category', label: 'One category' },
  { value: 'item', label: 'One item' },
];

export function DiscountForm({ discount, products, categories }: { discount?: Discount; products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: discount?.name ?? '',
    type: (discount?.type ?? 'all') as DiscountType,
    percent: discount ? String(discount.percent) : '10',
    startDate: discount?.startDate ?? todayLocal(),
    endDate: discount?.endDate ?? todayLocal(),
    target: discount?.target ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const set = (field: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const target = values.type === 'all' ? undefined : values.target || undefined;
    const problems = validateDiscount({ ...values, target });
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const saved: Discount = {
      id: discount?.id ?? uuidv4(),
      name: values.name.trim(),
      type: values.type,
      percent: Number(values.percent),
      startDate: values.startDate,
      endDate: values.endDate,
      ...(target ? { target } : {}),
    };
    const all = storage.getDiscounts();
    storage.saveDiscounts(discount ? all.map((d) => (d.id === discount.id ? saved : d)) : [...all, saved]);
    router.push('/admin/discounts');
  };

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name} hint="Shown only to staff, e.g. “Happy hour”.">
              <Input id="name" value={values.name} onChange={set('name')} aria-invalid={!!errors.name} required />
            </Field>
            <Field label="Discount (%)" htmlFor="percent" error={errors.percent}>
              <Input id="percent" type="number" inputMode="decimal" min="1" max="100" step="0.5" value={values.percent} onChange={set('percent')} aria-invalid={!!errors.percent} required />
            </Field>
            <Field label="Starts" htmlFor="startDate" error={errors.startDate}>
              <Input id="startDate" type="date" value={values.startDate} onChange={set('startDate')} aria-invalid={!!errors.startDate} required />
            </Field>
            <Field label="Ends (inclusive)" htmlFor="endDate" error={errors.endDate}>
              <Input id="endDate" type="date" min={values.startDate} value={values.endDate} onChange={set('endDate')} aria-invalid={!!errors.endDate} required />
            </Field>
            <Field label="Applies to" htmlFor="type">
              <Select
                id="type"
                value={values.type}
                onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as DiscountType, target: '' }))}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            {values.type !== 'all' && (
              <Field label={values.type === 'item' ? 'Menu item' : 'Category'} htmlFor="target" error={errors.target}>
                <Select id="target" value={values.target} onChange={set('target')} aria-invalid={!!errors.target} required>
                  <option value="">Choose...</option>
                  {values.type === 'item'
                    ? products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    : categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                </Select>
              </Field>
            )}
          </div>
          <p className="text-sm text-gray-500">
            If more than one discount fits an item, the biggest one wins. Discounts don&apos;t stack.
          </p>
          <div className="flex justify-end gap-2">
            <LinkButton href="/admin/discounts" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit">{discount ? 'Save changes' : 'Add discount'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Product } from '@/types';
import { unitPrice, type PricingContext } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ProductListProps {
  products: Product[];
  ctx: PricingContext;
  available: (product: Product) => number;
  onAdd: (product: Product) => void;
  disabled?: boolean;
  disabledMessage?: string;
  className?: string;
}

export default function ProductList({ products, ctx, available, onAdd, disabled, disabledMessage, className }: ProductListProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
    [products],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!term || p.name.toLowerCase().includes(term) || (p.sku ?? '').toLowerCase().includes(term)),
    );
  }, [products, search, category]);

  const nameOf = (id: string) => products.find((p) => p.id === id)?.name;

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="gap-3 pb-3">
        <CardTitle>Menu</CardTitle>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by name or SKU"
            aria-label="Search the menu"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                category === c ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {disabled && disabledMessage && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{disabledMessage}</p>
        )}
        <ul className="space-y-2 lg:max-h-[30rem] lg:overflow-y-auto lg:pr-1">
          {visible.map((product) => {
            const unit = unitPrice(product, ctx);
            const left = available(product);
            const soldOut = left < 1;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onAdd(product)}
                  disabled={disabled || soldOut}
                  className="flex w-full items-start justify-between gap-3 rounded-md border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900">{product.name}</span>
                    <span className="block text-xs text-gray-500">
                      {product.category || 'Uncategorised'}
                      {soldOut ? ' · Out of stock' : left <= 5 ? ` · ${left} left` : ''}
                    </span>
                    {product.isDeal && (
                      <span className="mt-1 block text-xs text-gray-500">
                        Includes: {(product.dealItems ?? []).map(nameOf).filter(Boolean).join(', ') || 'nothing yet'}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-gray-900">{formatMoney(unit.unitTotal)}</span>
                    {unit.discount > 0 && (
                      <span className="block text-xs text-gray-400 line-through">
                        {formatMoney(unitPrice(product, { ...ctx, discounts: [] }).unitTotal)}
                      </span>
                    )}
                    <span className="block text-[11px] text-gray-400">{unit.tax > 0 ? 'incl. tax' : 'no tax'}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="py-8 text-center text-sm text-gray-500">No menu items match.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

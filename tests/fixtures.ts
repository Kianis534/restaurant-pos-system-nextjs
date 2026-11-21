import type { Discount, OrderItem, Product } from '@/types';
import type { KeyValueStore } from '@/lib/storage';
import type { PricingContext } from '@/lib/pricing';

export const burger: Product = { id: 'burger', name: 'Burger', category: 'Mains', price: 10, cost: 4, quantity: 5 };
export const fries: Product = { id: 'fries', name: 'Fries', category: 'Sides', price: 3, cost: 1, quantity: 2 };
export const water: Product = { id: 'water', name: 'Water', category: 'Drinks', price: 1.5, cost: 0.3, quantity: 50 };
export const combo: Product = {
  id: 'combo',
  name: 'Combo',
  category: 'Deals',
  price: 11,
  cost: 0,
  quantity: 0,
  isDeal: true,
  dealItems: ['burger', 'fries'],
};
export const products = [burger, fries, water, combo];

export function discount(overrides: Partial<Discount> = {}): Discount {
  return { id: 'd1', name: 'Promo', type: 'all', percent: 10, startDate: '2026-01-01', endDate: '2026-12-31', ...overrides };
}

export function ctx(overrides: Partial<PricingContext> = {}): PricingContext {
  return { taxRate: 0.1, taxExemptProductIds: ['water'], discounts: [], now: new Date('2026-06-15T12:00:00Z'), ...overrides };
}

export function line(productId: string, quantity: number, extra: Partial<OrderItem> = {}): OrderItem {
  return { id: `${productId}-line`, productId, productName: productId, quantity, price: 0, discount: 0, tax: 0, total: 0, ...extra };
}

/** In-memory stand-in for window.localStorage. */
export function memoryStore(initial: Record<string, unknown> = {}): KeyValueStore & { dump: () => Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

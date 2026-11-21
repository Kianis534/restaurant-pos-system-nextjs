import { describe, expect, it } from 'vitest';
import {
  cartTotals,
  discountPercentFor,
  discountStatus,
  priceLine,
  repriceCart,
  roundMoney,
  unitPrice,
} from '@/lib/pricing';
import { burger, ctx, discount, fries, line, products, water } from './fixtures';

describe('roundMoney', () => {
  it('rounds half-cents up despite floating point', () => {
    expect(roundMoney(0.975)).toBe(0.98);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});

describe('discountStatus', () => {
  const d = discount({ startDate: '2026-06-10', endDate: '2026-06-15' });
  it('treats start and end days as inclusive', () => {
    expect(discountStatus(d, new Date('2026-06-10T00:00:00Z'))).toBe('active');
    expect(discountStatus(d, new Date('2026-06-15T23:59:00Z'))).toBe('active');
  });
  it('knows scheduled and expired discounts', () => {
    expect(discountStatus(d, new Date('2026-06-09T23:59:00Z'))).toBe('scheduled');
    expect(discountStatus(d, new Date('2026-06-16T00:00:00Z'))).toBe('expired');
  });
});

describe('discountPercentFor', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  it('applies whole-menu, category and item discounts', () => {
    expect(discountPercentFor(burger, [discount({ type: 'all', percent: 5 })], now)).toBe(5);
    expect(discountPercentFor(burger, [discount({ type: 'category', target: 'Mains', percent: 20 })], now)).toBe(20);
    expect(discountPercentFor(fries, [discount({ type: 'category', target: 'Mains', percent: 20 })], now)).toBe(0);
    expect(discountPercentFor(burger, [discount({ type: 'item', target: 'burger', percent: 30 })], now)).toBe(30);
  });
  it('uses the biggest discount instead of stacking them', () => {
    const list = [discount({ id: 'a', percent: 10 }), discount({ id: 'b', type: 'item', target: 'burger', percent: 25 })];
    expect(discountPercentFor(burger, list, now)).toBe(25);
  });
  it('ignores discounts that are not running', () => {
    expect(discountPercentFor(burger, [discount({ startDate: '2026-07-01', endDate: '2026-07-31' })], now)).toBe(0);
  });
  it('ignores a category or item discount with no target', () => {
    expect(discountPercentFor(burger, [discount({ type: 'category', target: undefined })], now)).toBe(0);
  });
});

describe('unitPrice and priceLine', () => {
  it('adds tax to the base price', () => {
    expect(unitPrice(burger, ctx())).toEqual({ price: 10, discount: 0, tax: 1, unitTotal: 11 });
  });
  it('charges tax on the discounted price', () => {
    const c = ctx({ discounts: [discount({ percent: 15 })] });
    // 10 - 1.50 = 8.50, tax 0.85
    expect(unitPrice(burger, c)).toEqual({ price: 10, discount: 1.5, tax: 0.85, unitTotal: 9.35 });
  });
  it('skips tax for exempt items', () => {
    expect(unitPrice(water, ctx()).tax).toBe(0);
    expect(unitPrice(water, ctx()).unitTotal).toBe(1.5);
  });
  it('multiplies the rounded unit total by quantity', () => {
    expect(priceLine(burger, 3, ctx())).toEqual({ price: 10, discount: 0, tax: 1, total: 33 });
  });
});

describe('cartTotals', () => {
  it('sums subtotal, discount, tax and total', () => {
    const c = ctx({ discounts: [discount({ type: 'item', target: 'burger', percent: 10 })] });
    const items = [
      { ...line('burger', 2), ...priceLine(burger, 2, c) },
      { ...line('water', 1), ...priceLine(water, 1, c) },
    ];
    expect(cartTotals(items)).toEqual({ subtotal: 21.5, discount: 2, tax: 1.8, total: 21.3, itemCount: 3 });
  });
  it('is all zeros for an empty cart', () => {
    expect(cartTotals([])).toEqual({ subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 });
  });
});

describe('repriceCart', () => {
  it('picks up new prices and names, and leaves unknown products alone', () => {
    const held = [line('burger', 2, { price: 8, total: 17.6, productName: 'Old name' }), line('ghost', 1, { total: 5 })];
    const updated = repriceCart(held, products, ctx());
    expect(updated[0]).toMatchObject({ productName: 'Burger', price: 10, total: 22 });
    expect(updated[1]).toEqual(held[1]);
  });
});

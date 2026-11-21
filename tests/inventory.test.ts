import { describe, expect, it } from 'vitest';
import { availableToAdd, deductStock, findMissingProducts, findStockProblems, stockUsage } from '@/lib/inventory';
import { burger, combo, fries, line, products } from './fixtures';

describe('stockUsage', () => {
  it('expands deals into their items', () => {
    const usage = stockUsage([line('combo', 2), line('burger', 1)], products);
    expect(Object.fromEntries(usage)).toEqual({ burger: 3, fries: 2 });
  });
});

describe('availableToAdd', () => {
  it('subtracts what is already in the cart', () => {
    expect(availableToAdd(burger, products, [])).toBe(5);
    expect(availableToAdd(burger, products, [line('burger', 4)])).toBe(1);
  });
  it('limits a deal by its scarcest item', () => {
    // fries stock is 2
    expect(availableToAdd(combo, products, [])).toBe(2);
    expect(availableToAdd(combo, products, [line('fries', 1)])).toBe(1);
  });
  it('counts deals in the cart against single items', () => {
    expect(availableToAdd(fries, products, [line('combo', 2)])).toBe(0);
  });
  it('returns 0 for an empty deal and never goes negative', () => {
    expect(availableToAdd({ ...combo, dealItems: [] }, products, [])).toBe(0);
    expect(availableToAdd(burger, products, [line('burger', 9)])).toBe(0);
  });
});

describe('findStockProblems', () => {
  it('reports lines that exceed stock', () => {
    expect(findStockProblems([line('combo', 3)], products)).toEqual([
      { productId: 'fries', productName: 'Fries', needed: 3, inStock: 2 },
    ]);
    expect(findStockProblems([line('burger', 5)], products)).toEqual([]);
  });
});

describe('findMissingProducts', () => {
  it('finds lines whose menu item was deleted', () => {
    const cart = [line('burger', 1), line('deleted-dish', 2)];
    expect(findMissingProducts(cart, products).map((l) => l.productId)).toEqual(['deleted-dish']);
    expect(findMissingProducts([line('combo', 1)], products)).toEqual([]);
  });
});

describe('deductStock', () => {
  it('returns new products with stock taken off, without mutating the input', () => {
    const before = JSON.stringify(products);
    const after = deductStock(products, [line('combo', 1), line('burger', 2)]);
    expect(after.find((p) => p.id === 'burger')?.quantity).toBe(2);
    expect(after.find((p) => p.id === 'fries')?.quantity).toBe(1);
    expect(after.find((p) => p.id === 'combo')?.quantity).toBe(0);
    expect(JSON.stringify(products)).toBe(before);
  });
});

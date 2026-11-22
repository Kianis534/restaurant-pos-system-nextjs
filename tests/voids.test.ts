import { describe, expect, it } from 'vitest';
import { isVoided, markVoided, validateVoid, voidReasonText, VOID_REASONS } from '@/lib/voids';
import { restoreStock } from '@/lib/inventory';
import { buildSale } from '@/lib/checkout';
import { priceLine } from '@/lib/pricing';
import { StorageService } from '@/lib/storage';
import { deductStock } from '@/lib/inventory';
import type { Order } from '@/types';
import { burger, combo, ctx, fries, line, memoryStore, products } from './fixtures';

function paidOrder(overrides: Partial<Order> = {}): Order {
  const items = [{ ...line('burger', 2), ...priceLine(burger, 2, ctx()) }];
  const { order } = buildSale({
    id: 'o1',
    receiptId: 'REC-000001',
    orderNumber: 'ORD-000001',
    type: 'takeaway',
    items,
    payment: { method: 'card' },
    employee: { id: 'u1', name: 'Cashier' },
    now: new Date('2026-06-15T12:00:00Z'),
  });
  return { ...order, ...overrides };
}

describe('void rules', () => {
  it('joins the reason and an optional note', () => {
    expect(voidReasonText('Wrong order entered', '  rang up twice ')).toBe('Wrong order entered: rang up twice');
    expect(voidReasonText('Payment problem', '   ')).toBe('Payment problem');
  });

  it('requires a reason, a short note and a completed order', () => {
    const order = paidOrder();
    expect(validateVoid(order, { reason: VOID_REASONS[0] })).toBeNull();
    expect(validateVoid(order, { reason: '' })).toBe('Choose a reason.');
    expect(validateVoid(order, { reason: 'Other', note: 'x'.repeat(201) })).toMatch(/under 200/);
    expect(validateVoid({ ...order, status: 'cancelled' }, { reason: 'Other' })).toBe('ORD-000001 is already voided.');
  });

  it('marks the order cancelled with who, when and why, without touching the totals', () => {
    const order = paidOrder();
    const voided = markVoided(order, { reason: 'Payment problem', note: 'card declined', by: 'Admin User', now: new Date('2026-06-15T13:00:00Z') });
    expect(voided).toMatchObject({
      status: 'cancelled',
      voidedAt: '2026-06-15T13:00:00.000Z',
      voidedBy: 'Admin User',
      voidReason: 'Payment problem: card declined',
      total: order.total,
      items: order.items,
    });
    expect(isVoided(voided)).toBe(true);
    expect(order.status).toBe('completed'); // input untouched
    expect(() => markVoided(voided, { reason: 'Other', by: 'Admin User' })).toThrow('already voided');
  });
});

describe('restoreStock', () => {
  it('puts items back, expanding deals and skipping deleted products', () => {
    const before = JSON.stringify(products);
    const after = restoreStock(products, [line('combo', 1), line('burger', 2), line('deleted-dish', 3)]);
    expect(after.find((p) => p.id === burger.id)?.quantity).toBe(burger.quantity + 3);
    expect(after.find((p) => p.id === fries.id)?.quantity).toBe(fries.quantity + 1);
    expect(after.find((p) => p.id === combo.id)?.quantity).toBe(0);
    expect(JSON.stringify(products)).toBe(before);
  });

  it('is the exact inverse of deductStock', () => {
    const items = [line('combo', 2), line('fries', 0)];
    expect(restoreStock(deductStock(products, items), items)).toEqual(products);
  });
});

describe('StorageService.voidOrder', () => {
  async function setup() {
    const storage = new StorageService(memoryStore());
    await storage.initialize();
    const items = [{ ...line('p-burger', 2), productName: 'Classic Burger', price: 12.99, tax: 1.3, total: 28.58 }];
    const { order, receipt } = buildSale({
      id: 'o1',
      receiptId: 'REC-000001',
      orderNumber: 'ORD-000001',
      type: 'takeaway',
      items,
      payment: { method: 'cash' },
      employee: { id: 'user-cashier-1', name: 'Front Desk Cashier' },
    });
    storage.saveOrders([order]);
    storage.saveReceipts([receipt]);
    storage.saveProducts(deductStock(storage.getProducts(), items));
    return storage;
  }

  it('voids the order and its receipt and restores stock', async () => {
    const storage = await setup();
    expect(storage.getProducts().find((p) => p.id === 'p-burger')?.quantity).toBe(98);

    storage.voidOrder('o1', { reason: 'Wrong order entered', note: 'rang up twice', by: 'Admin User' });

    const [order] = storage.getOrders();
    expect(order).toMatchObject({ status: 'cancelled', voidedBy: 'Admin User', voidReason: 'Wrong order entered: rang up twice' });
    expect(storage.getReceipts()[0]).toMatchObject({ voidedBy: 'Admin User', voidReason: 'Wrong order entered: rang up twice' });
    expect(storage.getReceipts()[0].voidedAt).toBe(order.voidedAt);
    expect(storage.getProducts().find((p) => p.id === 'p-burger')?.quantity).toBe(100);
  });

  it('refuses to void twice or void an unknown order, and changes nothing', async () => {
    const storage = await setup();
    storage.voidOrder('o1', { reason: 'Other', by: 'Admin User' });
    const snapshot = JSON.stringify(storage.exportData());
    expect(() => storage.voidOrder('o1', { reason: 'Other', by: 'Admin User' })).toThrow('already voided');
    expect(() => storage.voidOrder('nope', { reason: 'Other', by: 'Admin User' })).toThrow('no longer exists');
    expect(JSON.stringify(storage.exportData())).toBe(snapshot);
  });

  it('only keeps void details on voided orders', () => {
    const storage = new StorageService(
      memoryStore({ pos_orders: [{ id: 'x', orderNumber: 'ORD-1', status: 'completed', voidedBy: 'Someone', items: [] }] }),
    );
    expect(storage.getOrders()[0].voidedBy).toBeUndefined();
  });
});

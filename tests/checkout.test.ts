import { describe, expect, it } from 'vitest';
import { buildSale, validatePayment } from '@/lib/checkout';
import { priceLine } from '@/lib/pricing';
import { burger, ctx, line } from './fixtures';

const items = [{ ...line('burger', 2), ...priceLine(burger, 2, ctx()) }]; // 2 x 11.00 = 22.00
const base = {
  id: 'o1',
  receiptId: 'REC-000001',
  orderNumber: 'ORD-000001',
  type: 'takeaway' as const,
  items,
  employee: { id: 'u1', name: 'Cashier' },
  now: new Date('2026-06-15T12:00:00Z'),
};

describe('validatePayment', () => {
  it('rejects an empty order', () => {
    expect(validatePayment(0, { method: 'card' })).toBe('The order is empty.');
  });
  it('checks that cash covers the bill', () => {
    expect(validatePayment(22, { method: 'cash', cashTendered: 21.99 })).toBe('Cash received is less than the total.');
    expect(validatePayment(22, { method: 'cash', cashTendered: 22 })).toBeNull();
    expect(validatePayment(22, { method: 'cash', cashTendered: Number.NaN })).toBe('Enter a valid cash amount.');
    expect(validatePayment(22, { method: 'cash' })).toBeNull();
  });
  it('checks that split parts add up', () => {
    expect(validatePayment(22, { method: 'split', cashAmount: 10, cardAmount: 12 })).toBeNull();
    expect(validatePayment(22, { method: 'split', cashAmount: 10, cardAmount: 11 })).toBe('Cash and card amounts must add up to the total.');
    expect(validatePayment(22, { method: 'split', cashAmount: -1, cardAmount: 23 })).toBe('Enter valid cash and card amounts.');
  });
});

describe('buildSale', () => {
  it('records change for cash and sends the order to the kitchen', () => {
    const { order, receipt } = buildSale({ ...base, payment: { method: 'cash', cashTendered: 30 } });
    expect(order).toMatchObject({
      orderNumber: 'ORD-000001',
      total: 22,
      tax: 2,
      subtotal: 20,
      status: 'completed',
      kitchenStatus: 'pending',
      cashAmount: 22,
      cashTendered: 30,
      changeDue: 8,
      createdAt: '2026-06-15T12:00:00.000Z',
    });
    expect(receipt).toMatchObject({ id: 'REC-000001', orderId: 'o1', total: 22, changeDue: 8, orderType: 'takeaway' });
  });
  it('stores the table for dine-in orders', () => {
    const { order, receipt } = buildSale({ ...base, type: 'dine-in', table: { id: 't1', name: 'T01' }, payment: { method: 'card' } });
    expect(order).toMatchObject({ tableId: 't1', tableName: 'T01', cardAmount: 22 });
    expect(receipt.tableName).toBe('T01');
  });
  it('keeps both parts of a split payment', () => {
    const { order } = buildSale({ ...base, payment: { method: 'split', cashAmount: 7, cardAmount: 15 } });
    expect(order).toMatchObject({ paymentMethod: 'split', cashAmount: 7, cardAmount: 15 });
  });
  it('refuses a payment that does not cover the bill', () => {
    expect(() => buildSale({ ...base, payment: { method: 'cash', cashTendered: 5 } })).toThrow('Cash received is less than the total.');
  });
});

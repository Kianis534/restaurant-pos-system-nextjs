import { describe, expect, it } from 'vitest';
import { filterOrders, ordersToCsv, summarize } from '@/lib/reports';
import { receiptRows } from '@/lib/receipt';
import { formatMoney, toLocalDateKey } from '@/lib/format';
import type { Order, Receipt } from '@/types';

function order(overrides: Partial<Order>): Order {
  return {
    id: 'o',
    orderNumber: 'ORD-000001',
    type: 'takeaway',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    status: 'completed',
    kitchenStatus: 'served',
    createdAt: '2026-06-15T12:00:00.000Z',
    employeeId: 'u',
    employeeName: 'Cashier',
    paymentMethod: 'cash',
    ...overrides,
  };
}

const orders: Order[] = [
  order({
    id: 'a',
    total: 22,
    tax: 2,
    items: [{ id: '1', productId: 'burger', productName: 'Burger', quantity: 2, price: 10, discount: 0, tax: 1, total: 22 }],
  }),
  order({
    id: 'b',
    type: 'dine-in',
    paymentMethod: 'card',
    total: 5.5,
    tax: 0.5,
    discount: 1,
    createdAt: '2026-06-16T09:00:00.000Z',
    items: [{ id: '2', productId: 'fries', productName: 'Fries', quantity: 1, price: 6, discount: 1, tax: 0.5, total: 5.5 }],
  }),
  order({ id: 'c', status: 'cancelled', total: 99, createdAt: '2026-06-16T10:00:00.000Z' }),
];

describe('filterOrders', () => {
  it('keeps completed orders inside the inclusive day range', () => {
    expect(filterOrders(orders, { from: '', to: '' }).map((o) => o.id)).toEqual(['a', 'b']);
    expect(filterOrders(orders, { from: '2026-06-16', to: '2026-06-16' }).map((o) => o.id)).toEqual(['b']);
    expect(filterOrders(orders, { from: '', to: '2026-06-15' }).map((o) => o.id)).toEqual(['a']);
  });
});

describe('summarize', () => {
  it('totals revenue, tax, discounts, payments, order types, items and days', () => {
    const s = summarize(filterOrders(orders, { from: '', to: '' }));
    expect(s).toMatchObject({ orders: 2, revenue: 27.5, average: 13.75, tax: 2.5, discounts: 1 });
    expect(s.byPayment).toEqual({ cash: 22, card: 5.5, split: 0 });
    expect(s.byType).toEqual({ 'dine-in': 5.5, takeaway: 22 });
    expect(s.topItems[0]).toEqual({ productId: 'burger', name: 'Burger', quantity: 2, revenue: 22 });
    expect(s.byDay.map((d) => d.day)).toEqual(['2026-06-16', '2026-06-15']);
  });
});

describe('ordersToCsv', () => {
  it('quotes cells and defuses spreadsheet formulas', () => {
    const csv = ordersToCsv([order({ employeeName: '=HYPERLINK("http://evil")', items: [] })]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('"Order","Date","Type","Table","Cashier","Items","Subtotal","Discount","Tax","Total","Payment"');
    expect(row).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});

describe('receiptRows', () => {
  const receipt: Receipt = {
    id: 'REC-000001',
    orderId: 'o',
    orderNumber: 'ORD-000001',
    orderType: 'dine-in',
    tableName: 'T01',
    date: '2026-06-15T12:00:00.000Z',
    items: [{ id: '1', productId: 'p', productName: 'Cake', quantity: 2, price: 6.5, discount: 0.98, tax: 0.55, total: 12.14 }],
    subtotal: 13,
    discount: 1.96,
    tax: 1.1,
    total: 12.14,
    employeeName: 'Cashier',
    paymentMethod: 'split',
    cashAmount: 2.14,
    cardAmount: 10,
  };

  it('lists header, items, discount, totals and both split parts', () => {
    const rows = receiptRows(receipt, { receiptHeader: 'My Diner\nMain St', receiptFooter: 'Thanks' });
    expect(rows[0]).toEqual({ kind: 'center', left: 'My Diner', bold: true });
    const text = rows.map((r) => `${r.left ?? ''}|${r.right ?? ''}`).join('\n');
    expect(text).toContain('Type|Dine-in (T01)');
    expect(text).toContain(`Discount|-${formatMoney(1.96)}`);
    expect(text).toContain(`TOTAL|${formatMoney(12.14)}`);
    expect(text).toContain(`Card|${formatMoney(10)}`);
    expect(rows.at(-1)).toEqual({ kind: 'center', left: 'Thanks' });
  });

  it('leaves out the discount line when nothing was discounted', () => {
    const rows = receiptRows({ ...receipt, discount: 0, items: [] }, { receiptHeader: '', receiptFooter: '' });
    expect(rows.some((r) => r.left === 'Discount')).toBe(false);
  });
});

describe('toLocalDateKey', () => {
  it('formats the local calendar day', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

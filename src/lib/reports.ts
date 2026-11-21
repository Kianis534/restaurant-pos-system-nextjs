import type { Order, PaymentMethod } from '@/types';
import { toLocalDateKey } from './format';
import { roundMoney } from './pricing';

export interface DateRange {
  /** yyyy-mm-dd, inclusive. Empty means no lower bound. */
  from: string;
  /** yyyy-mm-dd, inclusive. Empty means no upper bound. */
  to: string;
}

export function filterOrders(orders: Order[], range: DateRange): Order[] {
  return orders.filter((o) => {
    if (o.status !== 'completed') return false;
    const day = toLocalDateKey(new Date(o.createdAt));
    return (!range.from || day >= range.from) && (!range.to || day <= range.to);
  });
}

export interface SalesSummary {
  orders: number;
  revenue: number;
  average: number;
  tax: number;
  discounts: number;
  byPayment: Record<PaymentMethod, number>;
  byType: { 'dine-in': number; takeaway: number };
  topItems: { productId: string; name: string; quantity: number; revenue: number }[];
  byDay: { day: string; orders: number; revenue: number }[];
}

export function summarize(orders: Order[]): SalesSummary {
  const byPayment: Record<PaymentMethod, number> = { cash: 0, card: 0, split: 0 };
  const byType = { 'dine-in': 0, takeaway: 0 };
  const items = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
  const days = new Map<string, { day: string; orders: number; revenue: number }>();
  let revenue = 0;
  let tax = 0;
  let discounts = 0;

  for (const order of orders) {
    revenue += order.total;
    tax += order.tax;
    discounts += order.discount;
    byPayment[order.paymentMethod] += order.total;
    byType[order.type] += order.total;
    for (const item of order.items) {
      const entry = items.get(item.productId) ?? { productId: item.productId, name: item.productName, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.total;
      items.set(item.productId, entry);
    }
    const day = toLocalDateKey(new Date(order.createdAt));
    const d = days.get(day) ?? { day, orders: 0, revenue: 0 };
    d.orders += 1;
    d.revenue += order.total;
    days.set(day, d);
  }

  const round = <T extends Record<string, number>>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, roundMoney(v)])) as T;

  return {
    orders: orders.length,
    revenue: roundMoney(revenue),
    average: orders.length ? roundMoney(revenue / orders.length) : 0,
    tax: roundMoney(tax),
    discounts: roundMoney(discounts),
    byPayment: round(byPayment),
    byType: round(byType),
    topItems: Array.from(items.values())
      .map((i) => ({ ...i, revenue: roundMoney(i.revenue) }))
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5),
    byDay: Array.from(days.values())
      .map((d) => ({ ...d, revenue: roundMoney(d.revenue) }))
      .sort((a, b) => b.day.localeCompare(a.day)),
  };
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);
  // Quote everything and neutralise leading = + - @ so spreadsheets don't run it as a formula.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function ordersToCsv(orders: Order[]): string {
  const header = ['Order', 'Date', 'Type', 'Table', 'Cashier', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment'];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt,
    o.type,
    o.tableName ?? '',
    o.employeeName,
    o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
    o.subtotal.toFixed(2),
    o.discount.toFixed(2),
    o.tax.toFixed(2),
    o.total.toFixed(2),
    o.paymentMethod,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

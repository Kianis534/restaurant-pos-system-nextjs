import type { Order, OrderItem, OrderType, PaymentMethod, Receipt, User } from '@/types';
import { cartTotals, roundMoney } from './pricing';

export interface PaymentInput {
  method: PaymentMethod;
  /** Cash handed over by the customer (cash payments). */
  cashTendered?: number;
  /** Split payments: the part paid in cash and the part paid by card. */
  cashAmount?: number;
  cardAmount?: number;
}

const isMoney = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Returns an error message, or null when the payment covers the bill. */
export function validatePayment(total: number, payment: PaymentInput): string | null {
  if (total <= 0) return 'The order is empty.';
  if (payment.method === 'cash') {
    if (payment.cashTendered === undefined) return null; // exact cash
    if (!isMoney(payment.cashTendered)) return 'Enter a valid cash amount.';
    if (roundMoney(payment.cashTendered) < roundMoney(total)) return 'Cash received is less than the total.';
    return null;
  }
  if (payment.method === 'split') {
    if (!isMoney(payment.cashAmount) || !isMoney(payment.cardAmount)) {
      return 'Enter valid cash and card amounts.';
    }
    if (Math.abs(roundMoney(payment.cashAmount + payment.cardAmount) - roundMoney(total)) > 0.009) {
      return 'Cash and card amounts must add up to the total.';
    }
  }
  return null;
}

export interface BuildSaleInput {
  id: string;
  receiptId: string;
  orderNumber: string;
  type: OrderType;
  table?: { id: string; name: string };
  items: OrderItem[];
  payment: PaymentInput;
  employee: Pick<User, 'id' | 'name'>;
  now?: Date;
}

/** Builds the order and its receipt. Throws if the payment doesn't cover the bill. */
export function buildSale(input: BuildSaleInput): { order: Order; receipt: Receipt } {
  const totals = cartTotals(input.items);
  const error = validatePayment(totals.total, input.payment);
  if (error) throw new Error(error);

  const payment: Pick<Order, 'cashAmount' | 'cardAmount' | 'cashTendered' | 'changeDue'> = {};
  if (input.payment.method === 'cash') {
    const tendered = roundMoney(input.payment.cashTendered ?? totals.total);
    payment.cashAmount = totals.total;
    payment.cashTendered = tendered;
    payment.changeDue = roundMoney(tendered - totals.total);
  } else if (input.payment.method === 'card') {
    payment.cardAmount = totals.total;
  } else {
    payment.cashAmount = roundMoney(input.payment.cashAmount ?? 0);
    payment.cardAmount = roundMoney(input.payment.cardAmount ?? 0);
  }

  const createdAt = (input.now ?? new Date()).toISOString();
  const order: Order = {
    id: input.id,
    orderNumber: input.orderNumber,
    type: input.type,
    ...(input.table ? { tableId: input.table.id, tableName: input.table.name } : {}),
    items: input.items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,
    status: 'completed',
    kitchenStatus: 'pending',
    createdAt,
    employeeId: input.employee.id,
    employeeName: input.employee.name,
    paymentMethod: input.payment.method,
    ...payment,
  };

  const receipt: Receipt = {
    id: input.receiptId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.type,
    ...(order.tableName ? { tableName: order.tableName } : {}),
    date: createdAt,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    tax: order.tax,
    total: order.total,
    employeeName: order.employeeName,
    paymentMethod: order.paymentMethod,
    ...payment,
  };

  return { order, receipt };
}

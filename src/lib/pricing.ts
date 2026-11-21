import type { Discount, OrderItem, Product, Settings } from '@/types';
import { toLocalDateKey } from './format';

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface PricingContext {
  taxRate: number;
  taxExemptProductIds: string[];
  discounts: Discount[];
  now?: Date;
}

export function pricingContext(settings: Settings, discounts: Discount[], now?: Date): PricingContext {
  return {
    taxRate: settings.taxRate,
    taxExemptProductIds: settings.taxExemptProductIds,
    discounts,
    now,
  };
}

export type DiscountStatus = 'active' | 'scheduled' | 'expired';

/** Start and end dates are inclusive and compared as local calendar days. */
export function discountStatus(discount: Discount, now: Date = new Date()): DiscountStatus {
  const today = toLocalDateKey(now);
  if (today < discount.startDate) return 'scheduled';
  if (today > discount.endDate) return 'expired';
  return 'active';
}

export function discountAppliesTo(discount: Discount, product: Product): boolean {
  switch (discount.type) {
    case 'all':
      return true;
    case 'category':
      return !!discount.target && product.category === discount.target;
    case 'item':
      return !!discount.target && product.id === discount.target;
    default:
      return false;
  }
}

/** The best active discount for a product, as a percentage (0 when none applies). Discounts don't stack. */
export function discountPercentFor(product: Product, discounts: Discount[], now: Date = new Date()): number {
  let best = 0;
  for (const discount of discounts) {
    if (discountStatus(discount, now) !== 'active') continue;
    if (!discountAppliesTo(discount, product)) continue;
    best = Math.max(best, discount.percent);
  }
  return Math.min(100, Math.max(0, best));
}

export interface UnitPrice {
  price: number;
  discount: number;
  tax: number;
  /** What the customer pays for one unit. */
  unitTotal: number;
}

export function unitPrice(product: Product, ctx: PricingContext): UnitPrice {
  const price = roundMoney(product.price);
  const percent = discountPercentFor(product, ctx.discounts, ctx.now);
  const discount = roundMoney((price * percent) / 100);
  const net = roundMoney(price - discount);
  const exempt = ctx.taxExemptProductIds.includes(product.id);
  const tax = exempt ? 0 : roundMoney(net * ctx.taxRate);
  return { price, discount, tax, unitTotal: roundMoney(net + tax) };
}

export function priceLine(
  product: Product,
  quantity: number,
  ctx: PricingContext,
): Pick<OrderItem, 'price' | 'discount' | 'tax' | 'total'> {
  const unit = unitPrice(product, ctx);
  return {
    price: unit.price,
    discount: unit.discount,
    tax: unit.tax,
    total: roundMoney(unit.unitTotal * quantity),
  };
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  itemCount: number;
}

export function cartTotals(items: OrderItem[]): CartTotals {
  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.price * item.quantity,
      discount: acc.discount + item.discount * item.quantity,
      tax: acc.tax + item.tax * item.quantity,
      total: acc.total + item.total,
      itemCount: acc.itemCount + item.quantity,
    }),
    { subtotal: 0, discount: 0, tax: 0, total: 0, itemCount: 0 },
  );
  return {
    subtotal: roundMoney(totals.subtotal),
    discount: roundMoney(totals.discount),
    tax: roundMoney(totals.tax),
    total: roundMoney(totals.total),
    itemCount: totals.itemCount,
  };
}

/** Re-prices every line, e.g. after a held order is reopened and prices or discounts changed. */
export function repriceCart(items: OrderItem[], products: Product[], ctx: PricingContext): OrderItem[] {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { ...item, productName: product.name, ...priceLine(product, item.quantity, ctx) } : item;
  });
}

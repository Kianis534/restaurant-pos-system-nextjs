import type { OrderItem, Product } from '@/types';

/**
 * Stock rules:
 * - A regular product uses its own `quantity`.
 * - A deal has no stock of its own. Selling one deal uses one unit of each bundled item.
 */

/** How many units of each regular product a set of order lines uses, deals expanded. */
export function stockUsage(items: Pick<OrderItem, 'productId' | 'quantity'>[], products: Product[]): Map<string, number> {
  const usage = new Map<string, number>();
  const add = (id: string, qty: number) => usage.set(id, (usage.get(id) ?? 0) + qty);
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (product.isDeal) {
      for (const componentId of product.dealItems ?? []) add(componentId, item.quantity);
    } else {
      add(product.id, item.quantity);
    }
  }
  return usage;
}

/** Units of `product` that can still be added on top of what is already in the cart. */
export function availableToAdd(product: Product, products: Product[], cart: OrderItem[]): number {
  const usage = stockUsage(cart, products);
  const remaining = (id: string) => {
    const p = products.find((x) => x.id === id);
    return p ? p.quantity - (usage.get(id) ?? 0) : 0;
  };
  if (product.isDeal) {
    const components = product.dealItems ?? [];
    if (components.length === 0) return 0;
    // A deal that lists the same item twice needs two units of it per deal.
    const perDeal = new Map<string, number>();
    for (const id of components) perDeal.set(id, (perDeal.get(id) ?? 0) + 1);
    let max = Infinity;
    for (const [id, need] of perDeal) max = Math.min(max, Math.floor(remaining(id) / need));
    return Math.max(0, max);
  }
  return Math.max(0, remaining(product.id));
}

export interface StockProblem {
  productId: string;
  productName: string;
  needed: number;
  inStock: number;
}

/** Lines that can't be fulfilled from current stock. Checked again just before taking payment. */
export function findStockProblems(cart: OrderItem[], products: Product[]): StockProblem[] {
  const problems: StockProblem[] = [];
  for (const [id, needed] of stockUsage(cart, products)) {
    const product = products.find((p) => p.id === id);
    const inStock = product?.quantity ?? 0;
    if (needed > inStock) {
      problems.push({ productId: id, productName: product?.name ?? 'Unknown item', needed, inStock });
    }
  }
  return problems;
}

/**
 * Lines whose menu item has been deleted since they were added (e.g. an order held on a
 * table while an admin removed the dish). They can't be priced or taken out of stock.
 */
export function findMissingProducts(cart: OrderItem[], products: Product[]): OrderItem[] {
  return cart.filter((item) => !products.some((p) => p.id === item.productId));
}

/** Returns a new product list with the sold quantities taken off. */
export function deductStock(products: Product[], cart: OrderItem[]): Product[] {
  const usage = stockUsage(cart, products);
  return products.map((p) => (usage.has(p.id) ? { ...p, quantity: p.quantity - (usage.get(p.id) ?? 0) } : p));
}

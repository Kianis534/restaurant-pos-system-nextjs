'use client';
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Discount, OrderItem, OrderType, Product, Receipt, Settings, User } from '@/types';
import { storage } from '@/lib/storage';
import { cartTotals, priceLine, pricingContext, repriceCart } from '@/lib/pricing';
import { availableToAdd, deductStock, findStockProblems } from '@/lib/inventory';
import { buildSale, type PaymentInput } from '@/lib/checkout';
import { seedSettings } from '@/lib/seed';
import { useStoredData } from './useStoredData';

const NO_PRODUCTS: Product[] = [];
const NO_DISCOUNTS: Discount[] = [];
const DEFAULT_SETTINGS: Settings = { ...seedSettings(), receiptHeader: '', receiptFooter: '' };

export type CheckoutResult = { ok: true; receipt: Receipt } | { ok: false; error: string };

/** Cart state and checkout shared by the dine-in and takeaway screens. */
export function usePosCart() {
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const discounts = useStoredData('discounts', () => storage.getDiscounts(), NO_DISCOUNTS);
  const settings = useStoredData('settings', () => storage.getSettings(), DEFAULT_SETTINGS);
  const ctx = useMemo(() => pricingContext(settings, discounts), [settings, discounts]);

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const totals = useMemo(() => cartTotals(cart), [cart]);

  const available = useCallback((product: Product) => availableToAdd(product, products, cart), [products, cart]);

  const addProduct = useCallback(
    (product: Product) => {
      if (availableToAdd(product, products, cart) < 1) {
        setNotice(`${product.name} is out of stock.`);
        return;
      }
      setNotice(null);
      setCart((current) => {
        const existing = current.find((item) => item.productId === product.id);
        if (existing) {
          const quantity = existing.quantity + 1;
          return current.map((item) => (item.id === existing.id ? { ...item, quantity, ...priceLine(product, quantity, ctx) } : item));
        }
        return [
          ...current,
          { id: uuidv4(), productId: product.id, productName: product.name, quantity: 1, ...priceLine(product, 1, ctx) },
        ];
      });
    },
    [products, cart, ctx],
  );

  const setQuantity = useCallback(
    (itemId: string, quantity: number) => {
      const item = cart.find((i) => i.id === itemId);
      if (!item) return;
      if (quantity < 1) {
        setCart((current) => current.filter((i) => i.id !== itemId));
        return;
      }
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;
      if (quantity > item.quantity && availableToAdd(product, products, cart) < quantity - item.quantity) {
        setNotice(`Only ${item.quantity + availableToAdd(product, products, cart)} ${product.name} left in stock.`);
        return;
      }
      setNotice(null);
      setCart((current) => current.map((i) => (i.id === itemId ? { ...i, quantity, ...priceLine(product, quantity, ctx) } : i)));
    },
    [cart, products, ctx],
  );

  const removeItem = useCallback((itemId: string) => setCart((current) => current.filter((i) => i.id !== itemId)), []);

  /** Replaces the cart, re-pricing lines in case prices, tax or discounts changed since they were held. */
  const loadCart = useCallback(
    (items: OrderItem[]) => {
      setNotice(null);
      setCart(repriceCart(items, products, ctx));
    },
    [products, ctx],
  );

  const clearCart = useCallback(() => {
    setNotice(null);
    setCart([]);
  }, []);

  const checkout = useCallback(
    (payment: PaymentInput, meta: { type: OrderType; table?: { id: string; name: string }; employee: User }): CheckoutResult => {
      if (cart.length === 0) return { ok: false, error: 'The order is empty.' };
      const latestProducts = storage.getProducts();
      const problems = findStockProblems(cart, latestProducts);
      if (problems.length) {
        const list = problems.map((p) => `${p.productName} (need ${p.needed}, have ${p.inStock})`).join(', ');
        return { ok: false, error: `Not enough stock: ${list}.` };
      }
      try {
        const orderNumber = storage.nextOrderNumber();
        const { order, receipt } = buildSale({
          id: uuidv4(),
          receiptId: orderNumber.replace('ORD-', 'REC-'),
          orderNumber,
          type: meta.type,
          table: meta.table,
          items: cart,
          payment,
          employee: meta.employee,
        });
        storage.saveOrders([...storage.getOrders(), order]);
        storage.saveReceipts([...storage.getReceipts(), receipt]);
        storage.saveProducts(deductStock(latestProducts, cart));
        setCart([]);
        setNotice(null);
        return { ok: true, receipt };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Payment failed.' };
      }
    },
    [cart],
  );

  return {
    products,
    settings,
    ctx,
    cart,
    totals,
    notice,
    setNotice,
    available,
    addProduct,
    setQuantity,
    removeItem,
    loadCart,
    clearCart,
    checkout,
  };
}

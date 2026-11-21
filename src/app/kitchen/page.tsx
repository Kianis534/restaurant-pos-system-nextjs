'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChefHat, LogOut } from 'lucide-react';
import type { KitchenStatus, Order, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { homePathFor, useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useStoredData } from '@/hooks/useStoredData';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/Feedback';

const NO_ORDERS: Order[] = [];
const NO_PRODUCTS: Product[] = [];

const NEXT_STEP: Partial<Record<KitchenStatus, { to: KitchenStatus; label: string }>> = {
  pending: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' },
  ready: { to: 'served', label: 'Mark served' },
};

const STATUS_STYLE: Record<KitchenStatus, string> = {
  pending: 'bg-amber-400 text-gray-900',
  preparing: 'bg-sky-400 text-gray-900',
  ready: 'bg-green-500 text-white',
  served: 'bg-gray-500 text-white',
};

/** Ticks once a minute so "x min ago" stays current. */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function KitchenDisplay() {
  const { user, logout } = useAuth();
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const dealContents = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product?.isDeal) return [];
    return (product.dealItems ?? []).map((id) => products.find((p) => p.id === id)?.name ?? 'Removed item');
  };
  const now = useNow();
  const { toast } = useFeedback();

  const active = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'completed' && o.kitchenStatus !== 'served')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [orders],
  );

  const advance = (order: Order) => {
    const step = NEXT_STEP[order.kitchenStatus];
    if (!step) return;
    const previous = order.kitchenStatus;
    storage.updateOrder(order.id, { kitchenStatus: step.to });
    // Served tickets leave the screen, so make a mis-tap easy to take back.
    if (step.to === 'served') {
      toast(`${order.orderNumber} marked as served.`, {
        tone: 'info',
        action: { label: 'Undo', onClick: () => storage.updateOrder(order.id, { kitchenStatus: previous }) },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-4 py-4 md:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ChefHat className="h-7 w-7 text-amber-400" aria-hidden="true" /> Kitchen display
        </h1>
        <div className="flex items-center gap-2">
          {user && user.role !== 'kitchen' && (
            <Link href={homePathFor(user.role)} className="rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
              Back
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <p className="mb-6 text-sm text-gray-400" aria-live="polite">
          {active.length === 0 ? 'No active orders. New paid orders appear here automatically.' : `${active.length} active order${active.length === 1 ? '' : 's'}`}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.map((order) => {
            const minutes = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / 60_000));
            const step = NEXT_STEP[order.kitchenStatus];
            return (
              <article
                key={order.id}
                className={cn(
                  'flex flex-col rounded-lg border bg-gray-800',
                  // New tickets get a glow for their first minute so they're hard to miss.
                  order.kitchenStatus === 'pending' && minutes === 0 ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-gray-700',
                )}
                data-testid="kitchen-ticket"
              >
                <div className="flex items-start justify-between gap-2 border-b border-gray-700 p-4">
                  <div>
                    <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
                    <p className="text-sm text-gray-300">
                      {order.type === 'dine-in' ? `Table ${order.tableName ?? '?'}` : 'Takeaway'} · {formatTime(order.createdAt)}
                    </p>
                    <p className={cn('text-xs', minutes >= 15 ? 'font-semibold text-red-400' : 'text-gray-400')}>
                      {minutes === 0 ? 'just now' : `${minutes} min ago`}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', STATUS_STYLE[order.kitchenStatus])}>
                    {order.kitchenStatus}
                  </span>
                </div>
                <ul className="flex-1 space-y-1.5 p-4 text-gray-100">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <div className="flex justify-between gap-3">
                        <span>{item.productName}</span>
                        <span className="font-bold">x{item.quantity}</span>
                      </div>
                      {dealContents(item.productId).length > 0 && (
                        <ul className="ml-3 list-disc pl-3 text-sm text-gray-400">
                          {dealContents(item.productId).map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                {step && (
                  <div className="border-t border-gray-700 p-4">
                    <Button className="w-full" variant={order.kitchenStatus === 'ready' ? 'secondary' : 'default'} onClick={() => advance(order)}>
                      {step.label}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default withAuth(KitchenDisplay, ['kitchen', 'admin', 'cashier']);

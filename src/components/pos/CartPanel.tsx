'use client';
import type { ReactNode } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { OrderItem } from '@/types';
import type { CartTotals } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface CartPanelProps {
  title: string;
  items: OrderItem[];
  totals: CartTotals;
  emptyMessage: string;
  notice?: string | null;
  onQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onPay: () => void;
  /** Line IDs whose menu item was deleted; they must be removed before payment. */
  unavailable?: Set<string>;
  /** Extra buttons under "Take payment" (hold, clear, ...). */
  actions?: ReactNode;
  className?: string;
}

export function CartPanel({
  title,
  items,
  totals,
  emptyMessage,
  notice,
  onQuantity,
  onRemove,
  onPay,
  unavailable,
  actions,
  className,
}: CartPanelProps) {
  const blocked = items.some((item) => unavailable?.has(item.id));
  return (
    <Card id="order-panel" className={cn('flex h-full scroll-mt-20 flex-col', className)}>
      <CardHeader className="pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {notice && (
          <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
            {notice}
          </p>
        )}
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          <>
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => {
                const gone = unavailable?.has(item.id) ?? false;
                return (
                  <li key={item.id} className={cn('rounded-md border p-2.5', gone ? 'border-red-300 bg-red-50' : 'border-gray-200')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        {gone ? (
                          <p className="text-xs font-medium text-red-700">No longer on the menu. Remove it to continue.</p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {formatMoney(item.price)} each
                            {item.discount > 0 && <span className="text-green-700"> · -{formatMoney(item.discount)} off</span>}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-semibold text-gray-900">{formatMoney(item.total)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="iconSm"
                          onClick={() => onQuantity(item.id, item.quantity - 1)}
                          aria-label={`One less ${item.productName}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium" data-testid="line-quantity">
                          <span className="sr-only">Quantity </span>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="iconSm"
                          onClick={() => onQuantity(item.id, item.quantity + 1)}
                          disabled={gone}
                          aria-label={`One more ${item.productName}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="iconSm" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.productName}`}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Discount</dt>
                  <dd>-{formatMoney(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <dt>Tax</dt>
                <dd>{formatMoney(totals.tax)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-lg font-semibold text-gray-900">
                <dt>Total</dt>
                <dd data-testid="cart-total">{formatMoney(totals.total)}</dd>
              </div>
            </dl>
            <div className="mt-4 grid gap-2">
              <Button onClick={onPay} className="w-full" disabled={blocked}>
                Take payment
              </Button>
              {actions}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Phones only: the order panel is below the menu, so keep the running total in reach. */
export function MobileCartBar({ totals }: { totals: CartTotals }) {
  if (totals.itemCount === 0) return null;
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
      <a href="#order-panel" className="flex items-center justify-between rounded-md bg-blue-600 px-4 py-3 font-medium text-white">
        <span>
          {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · {formatMoney(totals.total)}
        </span>
        <span>View order</span>
      </a>
    </div>
  );
}

'use client';
import type { Order, Product } from '@/types';
import { storage } from '@/lib/storage';
import { capitalize, formatDateTime, formatMoney } from '@/lib/format';
import { paymentLabel } from '@/lib/receipt';
import { useStoredData } from '@/hooks/useStoredData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/PageHeader';
import { VoidedNotice, VoidOrderButton } from './VoidOrder';

const NO_PRODUCTS: Product[] = [];
const NO_ORDERS: Order[] = [];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export function OrderDetailsSheet({ order: selected, onClose }: { order: Order | null; onClose: () => void }) {
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  // Show the stored copy, so the panel updates the moment the order is voided.
  const order = selected ? (orders.find((o) => o.id === selected.id) ?? selected) : null;

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Order {order?.orderNumber}
            {order?.status === 'cancelled' && <Badge tone="red">Voided</Badge>}
          </SheetTitle>
        </SheetHeader>
        {order && (
          <div className="space-y-5">
            <VoidedNotice voidedAt={order.voidedAt} voidedBy={order.voidedBy} voidReason={order.voidReason} />
            <dl className="divide-y divide-gray-100">
              <Row label="Time" value={formatDateTime(order.createdAt)} />
              <Row label="Type" value={order.type === 'dine-in' ? `Dine-in (${order.tableName ?? 'table'})` : 'Takeaway'} />
              <Row label="Cashier" value={order.employeeName} />
              <Row label="Kitchen" value={order.status === 'cancelled' ? 'Removed (voided)' : capitalize(order.kitchenStatus)} />
              <Row label="Payment" value={paymentLabel(order.paymentMethod)} />
              {order.paymentMethod === 'split' && (
                <>
                  <Row label="Cash" value={formatMoney(order.cashAmount ?? 0)} />
                  <Row label="Card" value={formatMoney(order.cardAmount ?? 0)} />
                </>
              )}
              {order.paymentMethod === 'cash' && order.changeDue !== undefined && (
                <Row label="Change given" value={formatMoney(order.changeDue)} />
              )}
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Items</h3>
              <ul className="space-y-2 text-sm">
                {order.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <li key={item.id} className="rounded-md border border-gray-200 p-2.5">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-gray-900">
                          {item.quantity} × {item.productName}
                        </span>
                        <span>{formatMoney(item.total)}</span>
                      </div>
                      {product?.isDeal && (
                        <p className="mt-1 text-xs text-gray-500">
                          Includes: {(product.dealItems ?? []).map((id) => products.find((p) => p.id === id)?.name ?? 'removed item').join(', ')}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <dl className="border-t border-gray-200 pt-3">
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              {order.discount > 0 && <Row label="Discount" value={`-${formatMoney(order.discount)}`} />}
              <Row label="Tax" value={formatMoney(order.tax)} />
              <div className="flex justify-between pt-2 text-lg font-bold text-gray-900">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>
            <VoidOrderButton order={order} className="w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

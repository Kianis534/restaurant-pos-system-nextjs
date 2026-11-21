'use client';
import { useEffect, useState } from 'react';
import type { OrderItem, Receipt } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { cartTotals } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { usePosCart } from '@/hooks/usePosCart';
import { useStoredData } from '@/hooks/useStoredData';
import { CashierLayout } from '@/components/layout/CashierLayout';
import ProductList from '@/components/pos/ProductList';
import { CartPanel, MobileCartBar } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const NO_HELD: OrderItem[][] = [];

function TakeawayPage() {
  const { user } = useAuth();
  // The order being rung up is kept in storage, so walking away from the screen doesn't lose it.
  const pos = usePosCart({ restore: () => storage.getTakeawayDraft() });
  const { cart } = pos;
  useEffect(() => {
    storage.saveTakeawayDraft(cart);
  }, [cart]);
  const held = useStoredData('heldTakeawayOrders', () => storage.getHeldTakeawayOrders(), NO_HELD);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const holdCurrent = () => {
    if (pos.cart.length === 0) return;
    storage.saveHeldTakeawayOrders([...storage.getHeldTakeawayOrders(), pos.cart]);
    pos.clearCart();
  };

  /** Opening a held order takes it off the hold list; the current cart (if any) goes on hold instead. */
  const resume = (index: number) => {
    const list = storage.getHeldTakeawayOrders();
    const order = list[index];
    if (!order) return;
    const rest = list.filter((_, i) => i !== index);
    storage.saveHeldTakeawayOrders(pos.cart.length ? [...rest, pos.cart] : rest);
    pos.loadCart(order);
  };

  const clear = () => {
    if (window.confirm('Remove every item from this order?')) pos.clearCart();
  };

  const confirmPayment = (payment: Parameters<typeof pos.checkout>[0]) => {
    if (!user) return 'You are signed out.';
    const result = pos.checkout(payment, { type: 'takeaway', employee: user });
    if (!result.ok) return result.error;
    setPaying(false);
    setReceipt(result.receipt);
    return null;
  };

  return (
    <CashierLayout>
      <div className="grid gap-6 pb-20 lg:grid-cols-3 lg:pb-0">
        <Card className="order-3 lg:order-none">
          <CardHeader className="pb-3">
            <CardTitle>Orders on hold</CardTitle>
          </CardHeader>
          <CardContent>
            {held.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No orders on hold.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {held.map((order, index) => {
                  const totals = cartTotals(order);
                  return (
                    <li key={order.map((i) => i.id).join('-') || index}>
                      <button
                        type="button"
                        onClick={() => resume(index)}
                        className="flex w-full flex-col items-start rounded-lg border border-amber-300 bg-amber-50 p-3 text-left hover:border-amber-400"
                      >
                        <span className="font-semibold text-gray-900">On hold #{index + 1}</span>
                        <span className="text-xs text-gray-600">
                          {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · {formatMoney(totals.total)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <ProductList className="order-1 lg:order-none" products={pos.products} ctx={pos.ctx} available={pos.available} onAdd={pos.addProduct} />

        <CartPanel
          className="order-2 lg:order-none"
          title="Takeaway order"
          items={pos.cart}
          totals={pos.totals}
          notice={pos.notice}
          emptyMessage="Tap a menu item to start a takeaway order."
          onQuantity={pos.setQuantity}
          onRemove={pos.removeItem}
          onPay={() => setPaying(true)}
          unavailable={pos.unavailable}
          actions={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={holdCurrent}>
                Hold order
              </Button>
              <Button variant="destructive" onClick={clear}>
                Clear
              </Button>
            </div>
          }
        />
      </div>

      <MobileCartBar totals={pos.totals} />
      <PaymentModal isOpen={paying} total={pos.totals.total} onClose={() => setPaying(false)} onConfirm={confirmPayment} />
      <ReceiptModal receipt={receipt} settings={pos.settings} onClose={() => setReceipt(null)} />
    </CashierLayout>
  );
}

export default withAuth(TakeawayPage, ['cashier', 'admin']);

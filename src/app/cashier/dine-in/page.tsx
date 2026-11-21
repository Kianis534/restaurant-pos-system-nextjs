'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Area, OrderItem, Receipt, Table } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { cartTotals } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usePosCart } from '@/hooks/usePosCart';
import { useStoredData } from '@/hooks/useStoredData';
import { CashierLayout } from '@/components/layout/CashierLayout';
import ProductList from '@/components/pos/ProductList';
import { CartPanel, MobileCartBar } from '@/components/pos/CartPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFeedback } from '@/components/ui/Feedback';

const NO_TABLES: Table[] = [];
const NO_AREAS: Area[] = [];
const NO_HELD: Record<string, OrderItem[]> = {};
const NO_TOTALS = cartTotals([]);

function DineInPage() {
  const { user } = useAuth();
  const pos = usePosCart();
  const { confirm } = useFeedback();
  const tables = useStoredData('tables', () => storage.getTables(), NO_TABLES);
  const areas = useStoredData('areas', () => storage.getAreas(), NO_AREAS);
  const held = useStoredData('heldTableOrders', () => storage.getHeldTableOrders(), NO_HELD);

  const [areaFilter, setAreaFilter] = useState('all');
  const [tableId, setTableId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  // If an admin deletes the selected table in another tab, treat it as deselected instead of
  // writing an orphaned tab for a table that no longer exists.
  const table = tables.find((t) => t.id === tableId) ?? null;
  const activeTableId = table?.id ?? null;
  const totals = table ? pos.totals : NO_TOTALS;

  // A table's order is its running tab: every change is saved straight away, so nothing is
  // lost when the cashier switches tables, reloads or walks away.
  const { cart } = pos;
  useEffect(() => {
    if (activeTableId) storage.saveHeldTableOrder(activeTableId, cart);
  }, [activeTableId, cart]);

  const visibleTables = useMemo(
    () => (areaFilter === 'all' ? tables : tables.filter((t) => t.area === areaFilter || t.area === '')),
    [tables, areaFilter],
  );

  const selectTable = (next: Table) => {
    if (next.id === activeTableId) return;
    setTableId(next.id);
    pos.loadCart(storage.getHeldTableOrder(next.id));
  };

  const closeTable = () => {
    setTableId(null);
    pos.clearCart();
  };

  const clearTable = async () => {
    if (!table) return;
    const ok = await confirm({
      title: `Clear table ${table.name}?`,
      description: 'Every item on this table is removed. Nothing is charged.',
      confirmLabel: 'Clear table',
      destructive: true,
    });
    if (ok) pos.clearCart();
  };

  const confirmPayment = (payment: Parameters<typeof pos.checkout>[0]) => {
    if (!user || !table) return 'Select a table first.';
    const result = pos.checkout(payment, { type: 'dine-in', table: { id: table.id, name: table.name }, employee: user });
    if (!result.ok) return result.error;
    storage.clearHeldTableOrder(table.id);
    setTableId(null);
    setPaying(false);
    setReceipt(result.receipt);
    return null;
  };

  return (
    <CashierLayout>
      <div className="grid gap-6 pb-20 lg:grid-cols-3 lg:pb-0">
        <Card>
          <CardHeader className="gap-3 pb-3">
            <CardTitle>Tables</CardTitle>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by area">
              {[{ id: 'all', name: 'all' }, ...areas].map((area) => (
                <Button
                  key={area.id}
                  size="sm"
                  variant={areaFilter === area.name ? 'default' : 'outline'}
                  onClick={() => setAreaFilter(area.name)}
                  aria-pressed={areaFilter === area.name}
                >
                  {area.name === 'all' ? 'All areas' : area.name}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {visibleTables.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No tables yet. An admin can add them under Tables.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
                {visibleTables.map((t) => {
                  const tab = held[t.id] ?? [];
                  const open = tab.length > 0;
                  const selected = t.id === activeTableId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTable(t)}
                      aria-pressed={selected}
                      className={cn(
                        'flex flex-col items-start rounded-lg border p-3 text-left transition',
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : open
                            ? 'border-amber-300 bg-amber-50 text-gray-900 hover:border-amber-400'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300',
                      )}
                    >
                      <span className="text-lg font-semibold">{t.name}</span>
                      <span className={cn('text-xs', selected ? 'text-blue-100' : 'text-gray-500')}>
                        {t.area || 'Any area'} · {t.capacity} seats
                      </span>
                      <span className={cn('mt-1 text-xs font-medium', selected ? 'text-white' : open ? 'text-amber-700' : 'text-green-700')}>
                        {open ? `Open · ${formatMoney(cartTotals(tab).total)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <ProductList
          products={pos.products}
          ctx={pos.ctx}
          available={pos.available}
          inCart={table ? pos.inCart : undefined}
          onAdd={pos.addProduct}
          disabled={!table}
          disabledMessage="Pick a table to start an order."
        />

        <CartPanel
          title={table ? `Table ${table.name}` : 'Order'}
          items={table ? pos.cart : []}
          totals={totals}
          notice={pos.notice}
          unavailable={pos.unavailable}
          emptyMessage={table ? 'No items yet. Tap a menu item to add it.' : 'Select a table to open its order.'}
          onQuantity={pos.setQuantity}
          onRemove={pos.removeItem}
          onPay={() => setPaying(true)}
          actions={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={closeTable}>
                Keep open
              </Button>
              <Button variant="destructive" onClick={clearTable}>
                Clear table
              </Button>
            </div>
          }
        />
      </div>

      <MobileCartBar totals={totals} />
      <PaymentModal isOpen={paying} total={totals.total} onClose={() => setPaying(false)} onConfirm={confirmPayment} />
      <ReceiptModal receipt={receipt} settings={pos.settings} onClose={() => setReceipt(null)} />
    </CashierLayout>
  );
}

export default withAuth(DineInPage, ['cashier', 'admin']);

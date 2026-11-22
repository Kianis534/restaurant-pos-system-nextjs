'use client';
import type { Order, Receipt, Settings } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { seedSettings } from '@/lib/seed';
import { useHydrated, useQueryParam, useStoredData } from '@/hooks/useStoredData';
import { RoleLayout } from '@/components/layout/RoleLayout';
import { ReceiptActions, ReceiptView } from '@/components/pos/Receipt';
import { LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { VoidedNotice, VoidOrderButton } from '@/components/admin/VoidOrder';

const DEFAULT_SETTINGS: Settings = seedSettings();
const NO_ORDERS: Order[] = [];

function BillDetailPage() {
  const hydrated = useHydrated();
  const id = useQueryParam('id');
  const receipt = useStoredData<Receipt | null>(
    `receipt:${id}`,
    () => storage.getReceipts().find((r) => r.id === id) ?? null,
    null,
  );
  const settings = useStoredData('settings', () => storage.getSettings(), DEFAULT_SETTINGS);
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  const order = receipt ? orders.find((o) => o.id === receipt.orderId) : undefined;

  return (
    <RoleLayout>
      <div className="no-print">
        <PageHeader title={receipt ? `Bill ${receipt.orderNumber}` : 'Bill'} backHref="/cashier/bills" />
      </div>
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : receipt ? (
        <div className="mx-auto w-full max-w-md space-y-4">
          {receipt.voidedAt && (
            <div className="no-print">
              <VoidedNotice voidedAt={receipt.voidedAt} voidedBy={receipt.voidedBy} voidReason={receipt.voidReason} />
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <ReceiptView receipt={receipt} settings={settings} />
          </div>
          <ReceiptActions receipt={receipt} settings={settings}>
            {order && <VoidOrderButton order={order} className="sm:ml-auto" />}
          </ReceiptActions>
        </div>
      ) : (
        <Card className="no-print">
          <CardContent className="py-10 text-center sm:py-10">
            <p className="text-gray-700">That bill doesn&apos;t exist on this device.</p>
            <LinkButton href="/cashier/bills" variant="outline" className="mt-4">
              Back to bills
            </LinkButton>
          </CardContent>
        </Card>
      )}
    </RoleLayout>
  );
}

export default withAuth(BillDetailPage, ['cashier', 'admin']);

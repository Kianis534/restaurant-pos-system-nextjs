'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Receipt } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { formatDateTime, formatMoney } from '@/lib/format';
import { paymentLabel } from '@/lib/receipt';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { RoleLayout } from '@/components/layout/RoleLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';

const NO_RECEIPTS: Receipt[] = [];

function BillsPage() {
  const hydrated = useHydrated();
  const receipts = useStoredData('receipts', () => storage.getReceipts(), NO_RECEIPTS);
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...receipts]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter(
        (r) =>
          !term ||
          r.orderNumber.toLowerCase().includes(term) ||
          r.id.toLowerCase().includes(term) ||
          (r.tableName ?? '').toLowerCase().includes(term) ||
          r.employeeName.toLowerCase().includes(term),
      );
  }, [receipts, search]);

  return (
    <RoleLayout>
      <PageHeader title="Bills" description="Every receipt issued on this device, newest first." />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Order no., table or cashier"
          aria-label="Search bills"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {!hydrated ? (
        <Spinner className="mx-auto" />
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-500 sm:py-10">
            {receipts.length === 0 ? 'No bills yet. Receipts show up here after each payment.' : 'No bills match your search.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`/cashier/bills/view?id=${encodeURIComponent(r.id)}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{r.orderNumber || r.id}</span>
                  <span className="font-semibold text-gray-900">{formatMoney(r.total)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{formatDateTime(r.date)}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {r.orderType === 'dine-in' ? `Dine-in ${r.tableName ?? ''}` : 'Takeaway'} · {paymentLabel(r.paymentMethod)} ·{' '}
                  {r.employeeName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RoleLayout>
  );
}

export default withAuth(BillsPage, ['cashier', 'admin']);

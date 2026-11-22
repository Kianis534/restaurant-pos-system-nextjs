'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { Ban, BadgePercent, DollarSign, Download, Landmark, Receipt as ReceiptIcon, Search, ShoppingCart } from 'lucide-react';
import type { Order } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { formatDate, formatDateTime, formatMoney, toLocalDateKey } from '@/lib/format';
import { filterOrders, filterVoided, ordersToCsv, summarize, voidedTotals, type DateRange } from '@/lib/reports';
import { paymentLabel } from '@/lib/receipt';
import { downloadBlob } from '@/lib/download';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { OrderDetailsSheet } from '@/components/admin/OrderDetailsSheet';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const NO_ORDERS: Order[] = [];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateKey(d);
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Today', range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
  { label: 'Last 7 days', range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
  { label: 'Last 30 days', range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
  { label: 'All time', range: () => ({ from: '', to: '' }) },
];

function ReportsPage() {
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [query, setQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  // If "From" ends up after "To" (easy to do when typing dates), read the range the other way round.
  const reversed = !!range.from && !!range.to && range.from > range.to;
  const period = useMemo<DateRange>(() => (reversed ? { from: range.to, to: range.from } : range), [range, reversed]);
  const inRange = useMemo(
    () => filterOrders(orders, period).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, period],
  );
  const summary = useMemo(() => summarize(inRange), [inRange]);
  const voided = useMemo(() => filterVoided(orders, period), [orders, period]);
  const voidedSum = voidedTotals(voided);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    const found = orders.find((o) => o.orderNumber.toLowerCase() === term) ?? orders.find((o) => o.orderNumber.toLowerCase().includes(term));
    setSearchMessage(found ? '' : `No order matches "${query.trim()}".`);
    setSelected(found ?? null);
  };

  const exportCsv = () => {
    // Voided orders are exported too, marked in the Status column, so the file is a full record.
    const rows = [...inRange, ...voided].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const blob = new Blob([ordersToCsv(rows)], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `orders-${period.from || 'start'}-to-${period.to || toLocalDateKey(new Date())}.csv`);
  };

  const presetActive = (p: (typeof PRESETS)[number]) => {
    const r = p.range();
    return r.from === range.from && r.to === range.to;
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Reports"
        description="Sales for the period you choose."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={inRange.length + voided.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="From" htmlFor="from">
              <Input id="from" type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
            </Field>
            <Field label="To" htmlFor="to">
              <Input id="to" type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
            </Field>
            {reversed && (
              <p className="w-full text-sm text-amber-700 sm:w-auto" role="status">
                Showing {formatDate(`${period.from}T00:00:00`)} to {formatDate(`${period.to}T00:00:00`)}.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <Button key={p.label} size="sm" variant={presetActive(p) ? 'default' : 'outline'} onClick={() => setRange(p.range())}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <form onSubmit={search} className="w-full max-w-xs space-y-1.5" noValidate>
            <label htmlFor="order-search" className="text-sm font-medium text-gray-900">
              Find an order
            </label>
            <div className="flex gap-2">
              <Input id="order-search" placeholder="e.g. ORD-000012" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button type="submit" variant="secondary" aria-label="Search orders">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchMessage && (
              <p className="text-sm text-red-600" role="alert">
                {searchMessage}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue" value={formatMoney(summary.revenue)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Orders" value={summary.orders} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Average order" value={formatMoney(summary.average)} icon={<ReceiptIcon className="h-4 w-4" />} />
        <StatCard label="Tax collected" value={formatMoney(summary.tax)} icon={<Landmark className="h-4 w-4" />} />
        <StatCard label="Discounts given" value={formatMoney(summary.discounts)} icon={<BadgePercent className="h-4 w-4" />} />
        <StatCard
          label="Voided"
          value={voidedSum.count}
          hint={voidedSum.count ? `${formatMoney(voidedSum.amount)} not counted` : 'No voided orders'}
          icon={<Ban className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topItems.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatMoney(item.revenue)}</TableCell>
                  </TableRow>
                ))}
                {summary.topItems.length === 0 && <TableEmpty colSpan={3}>No sales in this period.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How customers paid</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {(['cash', 'card', 'split'] as const).map((m) => (
                  <TableRow key={m}>
                    <TableCell>{paymentLabel(m)}</TableCell>
                    <TableCell className="text-right">{formatMoney(summary.byPayment[m])}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Dine-in orders</TableCell>
                  <TableCell className="text-right">{formatMoney(summary.byType['dine-in'])}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Takeaway orders</TableCell>
                  <TableCell className="text-right">{formatMoney(summary.byType.takeaway)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by day</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.byDay.slice(0, 14).map((d) => (
                  <TableRow key={d.day}>
                    <TableCell>{formatDate(`${d.day}T00:00:00`)}</TableCell>
                    <TableCell className="text-right">{d.orders}</TableCell>
                    <TableCell className="text-right">{formatMoney(d.revenue)}</TableCell>
                  </TableRow>
                ))}
                {summary.byDay.length === 0 && <TableEmpty colSpan={3}>No sales in this period.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inRange.slice(0, 15).map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setSelected(o)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(o)}
                  >
                    <TableCell className="font-medium text-blue-700">{o.orderNumber}</TableCell>
                    <TableCell>{formatDateTime(o.createdAt)}</TableCell>
                    <TableCell className="text-right">{formatMoney(o.total)}</TableCell>
                  </TableRow>
                ))}
                {inRange.length === 0 && <TableEmpty colSpan={3}>No orders in this period.</TableEmpty>}
              </TableBody>
            </Table>
            {inRange.length > 15 && <p className="mt-3 text-sm text-gray-500">Showing the latest 15 of {inRange.length}. Export CSV for all.</p>}
          </CardContent>
        </Card>
      </div>

      <OrderDetailsSheet order={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}

export default withAuth(ReportsPage, ['admin']);

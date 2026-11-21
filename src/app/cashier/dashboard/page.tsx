'use client';
import { useMemo } from 'react';
import { Package, UtensilsCrossed } from 'lucide-react';
import type { Order, OrderItem, Table as TableType } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { capitalize, formatMoney, formatTime, toLocalDateKey } from '@/lib/format';
import { useStoredData } from '@/hooks/useStoredData';
import { CashierLayout } from '@/components/layout/CashierLayout';
import { LinkButton } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const NO_ORDERS: Order[] = [];
const NO_TABLES: TableType[] = [];
const NO_HELD: Record<string, OrderItem[]> = {};

function CashierDashboard() {
  const { user } = useAuth();
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  const tables = useStoredData('tables', () => storage.getTables(), NO_TABLES);
  const held = useStoredData('heldTableOrders', () => storage.getHeldTableOrders(), NO_HELD);

  const stats = useMemo(() => {
    const today = toLocalDateKey(new Date());
    const todays = orders.filter((o) => o.status === 'completed' && toLocalDateKey(new Date(o.createdAt)) === today);
    const mine = todays.filter((o) => o.employeeId === user?.id);
    return {
      sales: todays.reduce((sum, o) => sum + o.total, 0),
      count: todays.length,
      mine: mine.length,
      openTables: tables.filter((t) => (held[t.id] ?? []).length > 0).length,
      recent: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    };
  }, [orders, tables, held, user?.id]);

  return (
    <CashierLayout>
      <PageHeader title={`Hello, ${user?.name ?? ''}`} description="Here's how today is going." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's sales" value={formatMoney(stats.sales)} />
        <StatCard label="Orders today" value={stats.count} hint={`${stats.mine} taken by you`} />
        <StatCard label="Open tables" value={`${stats.openTables} / ${tables.length}`} hint="Tables with an unpaid tab" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-2xl bg-blue-50 p-4">
            <UtensilsCrossed className="h-10 w-10 text-blue-600" aria-hidden="true" />
          </div>
          <CardTitle>Dine-in</CardTitle>
          <CardDescription className="mb-5 mt-2">Open a table, add items as guests order, and settle the bill.</CardDescription>
          <LinkButton href="/cashier/dine-in" className="w-full sm:w-auto">
            Open dine-in
          </LinkButton>
        </Card>
        <Card className="flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-2xl bg-purple-50 p-4">
            <Package className="h-10 w-10 text-purple-600" aria-hidden="true" />
          </div>
          <CardTitle>Takeaway</CardTitle>
          <CardDescription className="mb-5 mt-2">Ring up walk-in and takeaway orders, or park one on hold.</CardDescription>
          <LinkButton href="/cashier/takeaway" className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto">
            Open takeaway
          </LinkButton>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.type === 'dine-in' ? `Dine-in ${order.tableName ?? ''}` : 'Takeaway'}</TableCell>
                  <TableCell>{capitalize(order.kitchenStatus)}</TableCell>
                  <TableCell>{formatTime(order.createdAt)}</TableCell>
                  <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                </TableRow>
              ))}
              {stats.recent.length === 0 && <TableEmpty colSpan={5}>No orders yet.</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </CashierLayout>
  );
}

export default withAuth(CashierDashboard, ['cashier', 'admin']);

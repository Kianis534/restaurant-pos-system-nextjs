'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, ChefHat, DollarSign, FileText, Receipt as ReceiptIcon, ShoppingCart, TrendingUp } from 'lucide-react';
import type { Order, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { formatDateTime, formatMoney, toLocalDateKey } from '@/lib/format';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { OrderDetailsSheet } from '@/components/admin/OrderDetailsSheet';
import { LinkButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

const NO_ORDERS: Order[] = [];
const NO_PRODUCTS: Product[] = [];
const LOW_STOCK = 10;

function AdminDashboard() {
  const orders = useStoredData('orders', () => storage.getOrders(), NO_ORDERS);
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const [selected, setSelected] = useState<Order | null>(null);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === 'completed');
    const today = toLocalDateKey(new Date());
    const todays = completed.filter((o) => toLocalDateKey(new Date(o.createdAt)) === today);
    const revenue = completed.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue,
      todayRevenue: todays.reduce((sum, o) => sum + o.total, 0),
      todayCount: todays.length,
      count: completed.length,
      average: completed.length ? revenue / completed.length : 0,
      inKitchen: completed.filter((o) => o.kitchenStatus !== 'served').length,
      lowStock: products.filter((p) => !p.isDeal && p.quantity <= LOW_STOCK).sort((a, b) => a.quantity - b.quantity),
      recent: [...completed].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
    };
  }, [orders, products]);

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Sales and stock at a glance."
        actions={
          <>
            <LinkButton href="/cashier/dashboard" variant="outline">
              <ShoppingCart className="h-4 w-4" /> Open POS
            </LinkButton>
            <LinkButton href="/kitchen" variant="outline">
              <ChefHat className="h-4 w-4" /> Kitchen
            </LinkButton>
            <LinkButton href="/cashier/bills" variant="outline">
              <FileText className="h-4 w-4" /> Bills
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's revenue" value={formatMoney(stats.todayRevenue)} hint={`${stats.todayCount} orders today`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="All-time revenue" value={formatMoney(stats.revenue)} hint={`${stats.count} orders`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Average order" value={formatMoney(stats.average)} icon={<ReceiptIcon className="h-4 w-4" />} />
        <StatCard label="In the kitchen" value={stats.inKitchen} hint="Paid orders not served yet" icon={<ChefHat className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recent.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => setSelected(order)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(order)}
                  >
                    <TableCell className="font-medium text-blue-700">{order.orderNumber}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                    <TableCell>{order.employeeName}</TableCell>
                    <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                  </TableRow>
                ))}
                {stats.recent.length === 0 && <TableEmpty colSpan={4}>No orders yet. Sales from the POS show up here.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" /> Low stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">Everything has more than {LOW_STOCK} in stock.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.lowStock.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{p.name}</span>
                    <span className={p.quantity <= 0 ? 'font-semibold text-red-600' : 'font-medium text-amber-700'}>
                      {p.quantity <= 0 ? 'Out of stock' : `${p.quantity} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {stats.lowStock.length > 8 && <p className="mt-2 text-sm text-gray-500">and {stats.lowStock.length - 8} more.</p>}
            <LinkButton href="/admin/products" variant="outline" size="sm" className="mt-4">
              Manage menu
            </LinkButton>
          </CardContent>
        </Card>
      </div>

      <OrderDetailsSheet order={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}

export default withAuth(AdminDashboard, ['admin']);

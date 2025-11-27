'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { CashierLayout } from '@/components/layout/CashierLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UtensilsCrossed, Package } from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { Order, Table } from '@/types';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

function CashierDashboard() {
  const router = useRouter();
  const [todaysSales, setTodaysSales] = useState(0);
  const [ordersProcessed, setOrdersProcessed] = useState(0);
  const [openTables, setOpenTables] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const storage = new StorageService();
    const orders = storage.getOrders();
    const tables = storage.getTables();
    const today = new Date().toISOString().split('T')[0];

    const salesToday = orders
      .filter(order => order.createdAt.startsWith(today))
      .reduce((total, order) => total + order.total, 0);

    const processedToday = orders.filter(order => order.createdAt.startsWith(today)).length;

    const availableTables = tables.filter(table => table.area !== '').length;

    setTodaysSales(salesToday);
    setOrdersProcessed(processedToday);
    setOpenTables(availableTables);
    setRecentOrders(orders.slice(-5).reverse());
  }, []);

  return (
    <CashierLayout>
      <div className="flex flex-col gap-8">
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${todaysSales.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
              <span className="text-2xl">📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersProcessed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tables</CardTitle>
              <span className="text-2xl">🪑</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTables}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group relative flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
              <UtensilsCrossed className="h-14 w-14 text-blue-600" />
            </div>
            <CardTitle className="mb-3 text-lg font-semibold text-gray-800">Dine-in</CardTitle>
            <CardDescription className="mb-6 text-gray-600 leading-relaxed">
              Manage orders and payments for restaurant tables with real-time updates
            </CardDescription>
            <Button 
              onClick={() => router.push('/cashier/dine-in')}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300 py-2.5 rounded-xl font-medium"
            >
              Open Dine-in
            </Button>
          </Card>
          <Card className="group relative flex flex-col items-center justify-center p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
              <Package className="h-14 w-14 text-purple-600" />
            </div>
            <CardTitle className="mb-3 text-lg font-semibold text-gray-800">Walk-in / Take Away</CardTitle>
            <CardDescription className="mb-6 text-gray-600 leading-relaxed">
              Process and manage walk-in and take-away orders with a streamlined workflow
            </CardDescription>
            <Button
              onClick={() => router.push('/cashier/walk-in-take-away')}
              className="w-full bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-300 py-2.5 rounded-xl font-medium"
            >
              Open Walk-in / Take Away
            </Button>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <UiTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UiTable>
          </CardContent>
        </Card>
      </div>
    </CashierLayout>
  );
}
export default withAuth(CashierDashboard, ['cashier', 'admin']);
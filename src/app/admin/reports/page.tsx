'use client';
import { useState, useEffect, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Order, Product } from '@/types';
import { StorageService } from '@/lib/storage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { DollarSign, ShoppingCart, TrendingUp, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OrderDetailsSheet } from '@/components/admin/OrderDetailsSheet';

function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const storage = new StorageService();

  useEffect(() => {
    setOrders(storage.getOrders().filter(o => o.status === 'completed'));
    setProducts(storage.getProducts());
    setIsLoading(false);
  }, []);

  const totalSales = useMemo(() => {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }, [orders]);

  const totalOrders = useMemo(() => {
    return orders.length;
  }, [orders]);

  const averageOrderValue = useMemo(() => {
    return totalOrders > 0 ? totalSales / totalOrders : 0;
  }, [totalSales, totalOrders]);

  const bestSellingProducts = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productSales.get(item.productId);
        const quantity = (existing?.quantity || 0) + item.quantity;
        productSales.set(item.productId, { name: item.productName, quantity });
      });
    });
    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const handleSearch = () => {
    const allOrders = storage.getOrders();
    const order = allOrders.find(o => o.orderNumber === searchQuery);
    if (order) {
      setFoundOrder(order);
      setIsSheetOpen(true);
      setSearchMessage('');
    } else {
      setFoundOrder(null);
      setIsSheetOpen(false);
      setSearchMessage('No order found with that ID.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Reports</h1>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-300"
            />
            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" /> Search</Button>
          </div>
          {searchMessage && <p className="mt-2 text-red-600">{searchMessage}</p>}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-gray-500">All completed sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
            <p className="text-xs text-gray-500">Number of completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Average value per order</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Best-Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Product Name</TableHead>
                  <TableHead className="text-right text-gray-900">Quantity Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSellingProducts.map((p, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                    <TableCell className="text-right text-gray-900">{p.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Order ID</TableHead>
                  <TableHead className="text-gray-900">Date</TableHead>
                  <TableHead className="text-right text-gray-900">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map(order => (
                  <TableRow key={order.id} onClick={() => { setFoundOrder(order); setIsSheetOpen(true); }} className="cursor-pointer">
                    <TableCell className="font-medium text-gray-900">{order.orderNumber}</TableCell>
                    <TableCell className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right text-gray-900">${order.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <OrderDetailsSheet
        order={foundOrder}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </AdminLayout>
  );
}

export default withAuth(ReportsPage, ['admin']);
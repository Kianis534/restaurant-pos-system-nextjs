'use client';
import { useState, useEffect } from 'react';
import { Order } from '@/types';
import { StorageService } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

const KitchenDisplay = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const storage = new StorageService();

  const fetchOrders = () => {
    const allOrders = storage.getOrders();
    const activeOrders = allOrders.filter(
      order => order.status === 'pending' || order.status === 'preparing'
    );
    setOrders(activeOrders);
  };

  useEffect(() => {
    fetchOrders();
    setIsLoading(false);

    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const allOrders = storage.getOrders();
    const updatedOrders = allOrders.map(order =>
      order.id === orderId ? { ...order, status } : order
    );
    storage.saveOrders(updatedOrders);
    fetchOrders(); // Refresh the view
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-gray-900';
      case 'preparing':
        return 'bg-blue-500 text-gray-900';
      case 'ready':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Kitchen Display System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <p className="col-span-full text-center text-gray-400">No active orders.</p>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="bg-gray-800 text-white flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-semibold">Order #{order.orderNumber.slice(-4)}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-gray-300">Table: {order.tableId || 'Takeaway'}</p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-gray-200">
                  {order.items.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span className="font-medium">{item.productName}</span>
                      <span className="font-bold">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="mt-4 p-4 border-t border-gray-700 space-y-2">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full"
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full"
                    variant="secondary"
                  >
                    Mark as Ready
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
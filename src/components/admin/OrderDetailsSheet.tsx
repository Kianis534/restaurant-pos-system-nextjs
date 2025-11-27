'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Order, Product } from '@/types';
import { StorageService } from '@/lib/storage';
import { useState, useEffect } from 'react';

interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function OrderDetailsSheet({ order, isOpen, onOpenChange }: OrderDetailsSheetProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const storage = new StorageService();

  useEffect(() => {
    if (isOpen) {
      setProducts(storage.getProducts());
    }
  }, [isOpen]);

  if (!order) {
    return null;
  }

  const renderOrderItem = (item: any) => {
    const product = products.find(p => p.id === item.productId);
    if (product?.isDeal) {
      return (
        <li key={item.id} className="text-gray-900">
          <span className="font-medium">{product.name} (Deal)</span> (x{item.quantity}) - ${item.total.toFixed(2)}
          <ul className="list-disc list-inside pl-4">
            {product.dealItems?.map(dealItemId => {
              const dealItemProduct = products.find(p => p.id === dealItemId);
              return <li key={dealItemId} className="text-sm">{dealItemProduct?.name}</li>;
            })}
          </ul>
        </li>
      );
    }
    return (
      <li key={item.id} className="text-gray-900">
        {item.productName} (x{item.quantity}) - ${item.total.toFixed(2)}
      </li>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Order Details</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex justify-between text-gray-900">
            <span className="font-medium">Order ID:</span>
            <span>{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span className="font-medium">Time:</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span className="font-medium">Employee:</span>
            <span>{order.employeeName}</span>
          </div>
          <div className="flex justify-between text-gray-900">
            <span className="font-medium">Payment Method:</span>
            <span>{order.paymentMethod ? (order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)) : 'N/A'}</span>
          </div>
          {order.paymentMethod === 'hybrid' && (
            <>
              <div className="flex justify-between text-gray-900">
                <span className="font-medium">Cash Amount:</span>
                <span>${order.cashAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900">
                <span className="font-medium">Card Amount:</span>
                <span>${order.cardAmount?.toFixed(2)}</span>
              </div>
            </>
          )}
          <div>
            <h4 className="font-medium mb-2 text-gray-900">Items Sold:</h4>
            <ul className="list-disc list-inside space-y-1">
              {order.items.map(renderOrderItem)}
            </ul>
          </div>
          <div className="border-t pt-4 mt-4 flex justify-between font-bold text-lg text-gray-900">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
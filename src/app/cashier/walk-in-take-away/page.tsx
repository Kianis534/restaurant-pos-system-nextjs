'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/contexts/AuthContext';
import { Product, OrderItem, Order, Sale, Receipt } from '@/types';
import { StorageService } from '@/lib/storage';
import ProductList from '@/components/cashier/ProductList';
import { CashierLayout } from '@/components/layout/CashierLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Label } from '@/components/ui/Label';
import ReceiptComponent from '@/components/cashier/Receipt';

export default function WalkinTakeAwayPos() {
  const { user } = useAuth();
  const router = useRouter();
  const storage = new StorageService();
  
  const [walkinHeldOrders, setWalkinHeldOrders] = useState<OrderItem[][]>([]);
  const [selectedHeldOrderIndex, setSelectedHeldOrderIndex] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState(0);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'hybrid'>('cash');
  const [cashAmountInput, setCashAmountInput] = useState(0);
  const [cardAmountInput, setCardAmountInput] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    setWalkinHeldOrders(storage.getWalkinHeldOrders());
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    const settings = storage.getSettings();
    setGlobalTaxRate(settings.taxRate);
    setIsLoading(false);
  }, [storage]);

  const handleHeldOrderSelect = (order: OrderItem[], index: number) => {
    if (cart.length > 0 && index !== selectedHeldOrderIndex) {
      if (window.confirm('You have items in your cart. Would you like to place the current order on hold?')) {
        let newHeldOrders;
        if (selectedHeldOrderIndex !== null) {
          newHeldOrders = [...walkinHeldOrders];
          newHeldOrders[selectedHeldOrderIndex] = cart;
        } else {
          newHeldOrders = [...walkinHeldOrders, cart];
        }
        setWalkinHeldOrders(newHeldOrders);
        storage.saveWalkinHeldOrders(newHeldOrders);
      }
    }
    setCart(order);
    setSelectedHeldOrderIndex(index);
  };

  const holdOrder = () => {
    if (cart.length > 0) {
      let updatedHeldOrders;
      if (selectedHeldOrderIndex !== null) {
        updatedHeldOrders = [...walkinHeldOrders];
        updatedHeldOrders[selectedHeldOrderIndex] = cart;
      } else {
        updatedHeldOrders = [...walkinHeldOrders, cart];
      }
      storage.saveWalkinHeldOrders(updatedHeldOrders);
      setWalkinHeldOrders(updatedHeldOrders);
      setCart([]);
      setSelectedHeldOrderIndex(null);
    }
  };

  const clearOrder = () => {
    if (selectedHeldOrderIndex !== null) {
      const updatedHeldOrders = walkinHeldOrders.filter((_, index) => index !== selectedHeldOrderIndex);
      storage.saveWalkinHeldOrders(updatedHeldOrders);
      setWalkinHeldOrders(updatedHeldOrders);
    }
    setCart([]);
    setSelectedHeldOrderIndex(null);
  };

  const getItemTotalPrice = (product: Product, quantity: number) => {
    const basePrice = product.price;
    const taxRateToApply = globalTaxRate;
    const priceWithTax = basePrice * (1 + taxRateToApply);
    const taxAmount = basePrice * taxRateToApply;
    const total = priceWithTax * quantity;
    return { price: basePrice, tax: taxAmount, total: total };
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      const { price, tax, total } = getItemTotalPrice(product, existingItem.quantity + 1);
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, price, tax, total }
          : item
      ));
    } else {
      const { price, tax, total } = getItemTotalPrice(product, 1);
      const newItem: OrderItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price,
        tax,
        total
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    const itemToUpdate = cart.find(item => item.id === itemId);
    if(itemToUpdate) {
      const product = products.find(p => p.id === itemToUpdate.productId);
      if(product) {
        const { price, tax, total } = getItemTotalPrice(product, quantity);
        setCart(cart.map(item => 
          item.id === itemId 
            ? { ...item, quantity, price, tax, total }
            : item
        ));
      }
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const handleConfirmPayment = () => {
    const totalBill = getCartTotal();
    if (cart.length === 0) {
      alert('Cart is empty. Cannot process payment.');
      return;
    }

    if (paymentMethod === 'hybrid') {
      const totalHybridAmount = cashAmountInput + cardAmountInput;
      if (isNaN(cashAmountInput) || isNaN(cardAmountInput) || cashAmountInput < 0 || cardAmountInput < 0) {
        alert('Please enter valid numbers for cash and card amounts.');
        return;
      }
      if (Math.abs(totalHybridAmount - totalBill) > 0.01) {
        alert(`Total hybrid amount ($${totalHybridAmount.toFixed(2)}) must be equal to the total bill ($${totalBill.toFixed(2)}).`);
        return;
      }
    }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNumber: `ORD-${Date.now()}`,
      type: 'pickup',
      items: cart,
      status: 'completed',
      subtotal: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
      tax: cart.reduce((acc, item) => acc + item.tax * item.quantity, 0),
      total: totalBill,
      createdAt: new Date().toISOString(),
      employeeId: user!.id,
      employeeName: user!.name,
      paymentMethod: paymentMethod,
      cashAmount: paymentMethod === 'hybrid' || paymentMethod === 'cash' ? cashAmountInput : undefined,
      cardAmount: paymentMethod === 'hybrid' || paymentMethod === 'card' ? cardAmountInput : undefined,
    };
    
    const orders = storage.getOrders();
    storage.saveOrders([...orders, newOrder]);

    const newReceipt: Receipt = {
      id: `REC-${Date.now()}`,
      orderId: newOrder.id,
      date: newOrder.createdAt,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      tax: newOrder.tax,
      total: newOrder.total,
      employeeName: newOrder.employeeName,
    };
    storage.saveReceipt(newReceipt);
    setReceipt(newReceipt);
    setIsReceiptModalOpen(true);
    setIsPaymentModalOpen(false);
  };
  
  const handleCloseReceiptModal = () => {
    let updatedProducts = [...products];
    cart.forEach(item => {
      const product = updatedProducts.find(p => p.id === item.productId);
      if (product) {
        product.quantity -= item.quantity;
      }
    });
    setProducts(updatedProducts);
    storage.saveProducts(updatedProducts);
  
    clearOrder();
    setIsReceiptModalOpen(false);
    setPaymentMethod('cash');
    setCashAmountInput(0);
    setCardAmountInput(0);
    setReceipt(null);
  };

  const handlePrintReceipt = () => window.print();

  const handleDownloadReceipt = () => {
    const input = document.getElementById('receipt-content');
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', [79.5, 200]);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt-${receipt?.id}.pdf`);
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
  }

  return (
    <CashierLayout>
      <div className="flex flex-col md:flex-row h-full gap-6">
        <Card className="md:w-1/3">
          <CardHeader><CardTitle>On Hold Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {walkinHeldOrders.map((order, index) => (
                <Button key={index} onClick={() => handleHeldOrderSelect(order, index)} variant={selectedHeldOrderIndex === index ? 'default' : 'outline'} className="flex flex-col h-auto py-4">
                  <span className="font-semibold text-lg text-gray-900">Order {index + 1}</span>
                  <span className="text-sm text-gray-800">{order.length} items</span>
                </Button>
              ))}
              {walkinHeldOrders.length === 0 && <p className="text-sm text-gray-500 col-span-2">No orders on hold.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="md:w-1/3"><ProductList products={products} onAddToCart={addToCart} getItemTotalPrice={getItemTotalPrice} disabled={false} /></div>

        <Card className="md:w-1/3 flex flex-col">
          <CardHeader><CardTitle className="text-gray-900">{selectedHeldOrderIndex !== null ? `On Hold Order ${selectedHeldOrderIndex + 1}` : 'New Walk-in / Take Away Order'}</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Cart is empty.</div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">{cart.map(item => (<div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-600">${item.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                        <span className="w-16 text-right font-semibold">${item.total.toFixed(2)}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>×</Button>
                      </div>
                    </div>))}</div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-semibold mb-4">
                    <span className="text-gray-900">Total:</span><span className="text-gray-900">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={() => setIsPaymentModalOpen(true)} className="w-full">Process Payment</Button>
                    <Button onClick={holdOrder} variant="outline" className="w-full">Hold Order</Button>
                    <Button onClick={clearOrder} variant="destructive" className="w-full">Clear Order</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Select Payment Method">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="payment-cash" className="flex items-center gap-2 text-gray-900"><input type="radio" id="payment-cash" name="payment-method" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="form-radio" />Cash</Label>
            <Label htmlFor="payment-card" className="flex items-center gap-2 text-gray-900"><input type="radio" id="payment-card" name="payment-method" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="form-radio" />Card</Label>
            <Label htmlFor="payment-hybrid" className="flex items-center gap-2 text-gray-900"><input type="radio" id="payment-hybrid" name="payment-method" value="hybrid" checked={paymentMethod === 'hybrid'} onChange={() => setPaymentMethod('hybrid')} className="form-radio" />Hybrid</Label>
          </div>
          {paymentMethod === 'hybrid' && (<div className="space-y-2">
              <div>
                <Label htmlFor="cash-amount" className="block text-sm font-medium text-gray-900">Cash Amount</Label>
                <Input type="number" id="cash-amount" value={cashAmountInput} onChange={(e) => { const cash = Number(e.target.value); setCashAmountInput(cash); const remaining = getCartTotal() - cash; setCardAmountInput(Math.max(0, remaining)); }} className="w-full text-gray-900" />
              </div>
              <div>
                <Label htmlFor="card-amount" className="block text-sm font-medium text-gray-900">Card Amount</Label>
                <Input type="number" id="card-amount" value={cardAmountInput} onChange={(e) => { const card = Number(e.target.value); setCardAmountInput(card); const remaining = getCartTotal() - card; setCashAmountInput(Math.max(0, remaining)); }} className="w-full text-gray-900" />
              </div>
            </div>)}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmPayment}>Confirm Payment</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReceiptModalOpen} onClose={handleCloseReceiptModal} title="Receipt">
        {receipt && (
          <div>
            <div id="receipt-content"><ReceiptComponent receipt={receipt} /></div>
            <div className="mt-4 flex space-x-2">
              <Button onClick={handlePrintReceipt}>Print</Button>
              <Button onClick={handleDownloadReceipt}>Download PDF</Button>
              <Button variant="outline" onClick={handleCloseReceiptModal}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </CashierLayout>
  );
}

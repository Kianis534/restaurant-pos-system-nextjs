'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Product } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';
import Select from 'react-select';
import { v4 as uuidv4 } from 'uuid';

const NewDealPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<{ value: string; label: string }[]>([]);
  const storage = new StorageService();

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    // Fetch only individual products to be included in a deal
    setProducts(storage.getProducts().filter(p => !p.isDeal));
  }, []);

  useEffect(() => {
    const total = selectedProducts.reduce((acc, selectedProduct) => {
      const product = products.find(p => p.id === selectedProduct.value);
      return acc + (product?.price || 0);
    }, 0);
    setCalculatedPrice(total);
  }, [selectedProducts, products]);

  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

// ... inside the form, update the Deal Price section

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900">Deal Price</label>
                <Input
                  type="number"
                  id="price"
                  value={dealPrice}
                  onChange={(e) => setDealPrice(Number(e.target.value))}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Calculated Price: ${calculatedPrice.toFixed(2)}</p>
              </div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealName || !dealPrice || selectedProducts.length === 0) {
      alert('Please fill out all fields and select at least one product for the deal.');
      return;
    }

    const newDeal: Product = {
      id: uuidv4(),
      name: dealName,
      price: Number(dealPrice),
      isDeal: true,
      dealItems: selectedProducts.map(p => p.value),
      // Default values for non-applicable fields
      category: 'Deals',
      cost: 0,
      quantity: 0,
    };

    const allProducts = storage.getProducts();
    storage.saveProducts([...allProducts, newDeal]);
    router.push('/admin/products');
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 text-gray-900">
          Add New Deal
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Deal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">Deal Name</label>
                <Input
                  type="text"
                  id="name"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900">Deal Price</label>
                <Input
                  type="number"
                  id="price"
                  value={dealPrice}
                  onChange={(e) => setDealPrice(Number(e.target.value))}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900">Select Products</label>
                <Select
                  isMulti
                  options={productOptions}
                  value={selectedProducts}
                  onChange={(selected) => setSelectedProducts(selected as any)}
                  className="mt-1"
                  classNamePrefix="select"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link href="/admin/products">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                Save Deal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(NewDealPage, ['admin']);
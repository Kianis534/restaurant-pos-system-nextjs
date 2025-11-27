'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Product } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Select from 'react-select';

const EditDealPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [products, setProducts] = useState<Product[]>([]);
  const [deal, setDeal] = useState<Product | null>(null);
  const [dealName, setDealName] = useState('');
  const [dealPrice, setDealPrice] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<{ value: string; label: string }[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const storage = new StorageService();

  useEffect(() => {
    // Fetch only individual products to be included in a deal
    setProducts(storage.getProducts().filter(p => !p.isDeal));

    if (id) {
      const allProducts = storage.getProducts();
      const dealToEdit = allProducts.find(p => p.id === id);
      if (dealToEdit) {
        setDeal(dealToEdit);
        setDealName(dealToEdit.name);
        setDealPrice(dealToEdit.price);
        const dealProductOptions = dealToEdit.dealItems?.map(productId => {
          const product = allProducts.find(p => p.id === productId);
          return { value: productId, label: product?.name || '' };
        });
        setSelectedProducts(dealProductOptions || []);
      }
    }
  }, [id]);

  useEffect(() => {
    const total = selectedProducts.reduce((acc, selectedProduct) => {
      const product = products.find(p => p.id === selectedProduct.value);
      return acc + (product?.price || 0);
    }, 0);
    setCalculatedPrice(total);
  }, [selectedProducts, products]);

  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dealName || !dealPrice || selectedProducts.length === 0) {
      alert('Please fill out all fields and select at least one product for the deal.');
      return;
    }

    if (deal) {
      const updatedDeal: Product = {
        ...deal,
        name: dealName,
        price: Number(dealPrice),
        dealItems: selectedProducts.map(p => p.value),
      };

      const allProducts = storage.getProducts();
      const updatedProducts = allProducts.map(p => p.id === id ? updatedDeal : p);
      storage.saveProducts(updatedProducts);
      router.push('/admin/products');
    }
  };
  
  if (!deal) {
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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 text-gray-900">
          Edit Deal
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
                <p className="text-sm text-gray-500 mt-1">Calculated Price: ${calculatedPrice.toFixed(2)}</p>
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(EditDealPage, ['admin']);
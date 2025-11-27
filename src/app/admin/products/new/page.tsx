'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Product, Category } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { v4 as uuidv4 } from 'uuid';

const NewProductPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState(0);
  const [taxExemptProductIds, setTaxExemptProductIds] = useState<string[]>([]);
  const [product, setProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    cost: 0,
    quantity: 0,
    category: '',
  });
  const storage = new StorageService();

  useEffect(() => {
    setCategories(storage.getCategories());
    const settings = storage.getSettings();
    setGlobalTaxRate(settings.globalTaxRate);
    setTaxExemptProductIds(settings.taxExemptProductIds);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setProduct(prev => ({
      ...prev,
      category: value,
    }));
  };

  const getPriceWithTax = (basePrice: number): number => {
    return basePrice * (1 + globalTaxRate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: uuidv4(),
      ...product,
      price: Number(product.price),
      cost: Number(product.cost),
      quantity: Number(product.quantity),
    };
    const products = storage.getProducts();
    storage.saveProducts([...products, newProduct]);
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
          Add New Product
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">Name</label>
                <Input type="text" id="name" name="name" value={product.name} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900">Category</label>
                <Select onValueChange={handleCategoryChange} value={product.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900">Base Price</label>
                <Input type="number" id="price" name="price" value={product.price} onChange={handleChange} required />
                <p className="text-sm text-gray-500 mt-1">Total Price (with tax): ${getPriceWithTax(Number(product.price)).toFixed(2)}</p>
              </div>
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-900">Cost</label>
                <Input type="number" id="cost" name="cost" value={product.cost} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-900">Quantity</label>
                <Input type="number" id="quantity" name="quantity" value={product.quantity} onChange={handleChange} required />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link href="/admin/products">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                Save Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(NewProductPage, ['admin']);
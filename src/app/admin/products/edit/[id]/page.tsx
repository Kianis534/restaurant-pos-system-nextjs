'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Product, Category } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState(0);
  const [taxExemptProductIds, setTaxExemptProductIds] = useState<string[]>([]);
  const storage = new StorageService();

  useEffect(() => {
    if (id) {
      const products = storage.getProducts();
      const productToEdit = products.find(p => p.id === id);
      if (productToEdit) {
        setProduct(productToEdit);
      }
    }
    setCategories(storage.getCategories());
    const settings = storage.getSettings();
    setGlobalTaxRate(settings.globalTaxRate);
    setTaxExemptProductIds(settings.taxExemptProductIds);
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (product) {
      setProduct({
        ...product,
        [name]: value,
      });
    }
  };
  
  const handleCategoryChange = (value: string) => {
    if (product) {
      setProduct({
        ...product,
        category: value,
      });
    }
  };

  const getPriceWithTax = (basePrice: number): number => {
    // For editing existing products, check if their actual ID is in taxExemptProductIds
    const isTaxExempt = taxExemptProductIds.includes(id as string);
    if (isTaxExempt) {
      return basePrice;
    }
    return basePrice * (1 + globalTaxRate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      const updatedProduct = {
        ...product,
        price: Number(product.price),
        cost: Number(product.cost),
        quantity: Number(product.quantity),
      };
      const products = storage.getProducts();
      const updatedProducts = products.map(p => p.id === id ? updatedProduct : p);
      storage.saveProducts(updatedProducts);
      router.push('/admin/products');
    }
  };

  if (!product) {
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
          Edit Product
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(EditProductPage, ['admin']);
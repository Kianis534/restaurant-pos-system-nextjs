'use client';
import { useState, useEffect, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Product, Category } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const storage = new StorageService();

  useEffect(() => {
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
    setIsLoading(false);
  }, []);

  const handleProductDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== productId);
      storage.saveProducts(updatedProducts);
      setProducts(updatedProducts);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') {
      alert('Category name cannot be empty.');
      return;
    }
    const newCategory: Category = {
      id: uuidv4(),
      name: newCategoryName.trim(),
    };
    const updatedCategories = [...categories, newCategory];
    storage.saveCategories(updatedCategories);
    setCategories(updatedCategories);
    setNewCategoryName('');
  };

  const handleCategoryDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will also remove the category from all products.')) {
      const categoryToDelete = categories.find(c => c.id === categoryId);
      if (!categoryToDelete) return;

      const updatedProducts = products.map(product => {
        if (product.category === categoryToDelete.name) {
          return { ...product, category: '' };
        }
        return product;
      });
      storage.saveProducts(updatedProducts);
      setProducts(updatedProducts);

      const updatedCategories = categories.filter(c => c.id !== categoryId);
      storage.saveCategories(updatedCategories);
      setCategories(updatedCategories);
    }
  };

  const filteredItems = useMemo(() => {
    return products.filter(product =>
      !product.isDeal && product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredDeals = useMemo(() => {
    return products.filter(product =>
      product.isDeal && product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <div className="space-x-4">
          <Link href="/admin/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </Link>
          <Link href="/admin/products/new-deal">
            <Button variant="secondary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Deal
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="relative w-full max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search products by name..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Name</TableHead>
                  <TableHead className="text-gray-900">Category</TableHead>
                  <TableHead className="text-gray-900">Price</TableHead>
                  <TableHead className="text-gray-900">Cost</TableHead>
                  <TableHead className="text-gray-900">Quantity</TableHead>
                  <TableHead className="text-right text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(product => {
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                      <TableCell className="text-gray-900">{product.category}</TableCell>
                      <TableCell className="text-gray-900">
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-900">${product.cost.toFixed(2)}</TableCell>
                      <TableCell className="text-gray-900">{product.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/products/edit/${product.id}`}>
                          <Button variant="ghost" size="sm" className="mr-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => handleProductDelete(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Name</TableHead>
                  <TableHead className="text-gray-900">Price</TableHead>
                  <TableHead className="text-right text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map(deal => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-gray-900">{deal.name}</TableCell>
                    <TableCell className="text-gray-900">${deal.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/products/edit-deal/${deal.id}`}>
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleProductDelete(deal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Category Management</h2>
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full"
                />
                <Button onClick={handleAddCategory}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Existing Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900">Name</TableHead>
                    <TableHead className="text-right text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium text-gray-900">{category.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleCategoryDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(ProductManagement, ['admin']);
'use client';
import { useState, useEffect } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Sale, Product } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // New state for products
  const [isLoading, setIsLoading] = useState(true);
  const storage = new StorageService();

  useEffect(() => {
    setSales(storage.getSales());
    setProducts(storage.getProducts()); // Fetch products
    setIsLoading(false);
  }, []);

  const handleDelete = (saleId: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      const updatedSales = sales.filter(s => s.id !== saleId);
      storage.saveSales(updatedSales);
      setSales(updatedSales);
    }
  };

  const getTargetDisplayName = (sale: Sale) => {
    if (sale.type === 'item') {
      const product = products.find(p => p.id === sale.target);
      return product ? product.name : sale.target; // Fallback to ID if product not found
    } else if (sale.type === 'category') {
      return sale.target; // Already the category name
    } else if (sale.type === 'flat') {
      return 'All Products';
    }
    return 'N/A'; // Fallback
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
        <Link href="/admin/sales/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Sale
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-900">Name</TableHead>
                <TableHead className="text-gray-900">Type</TableHead>
                <TableHead className="text-gray-900">Discount</TableHead>
                <TableHead className="text-gray-900">Start Date</TableHead>
                <TableHead className="text-gray-900">End Date</TableHead>
                <TableHead className="text-gray-900">Target</TableHead>
                <TableHead className="text-right text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-gray-900">{sale.name}</TableCell>
                  <TableCell className="text-gray-900">{sale.type}</TableCell>
                  <TableCell className="text-gray-900">{sale.discount}%</TableCell>
                  <TableCell className="text-gray-900">{format(new Date(sale.startDate), 'PPP')}</TableCell>
                  <TableCell className="text-gray-900">{format(new Date(sale.endDate), 'PPP')}</TableCell>
                  <TableCell className="text-gray-900">{getTargetDisplayName(sale)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(sale.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(SalesManagement, ['admin']);
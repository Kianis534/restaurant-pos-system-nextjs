'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Sale, Product, Category } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const NewSalePage = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sale, setSale] = useState<Omit<Sale, 'id'>>({
    name: '',
    type: 'flat',
    discount: 0,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    target: 'all',
  });
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const storage = new StorageService();

  useEffect(() => {
    setProducts(storage.getProducts());
    setCategories(storage.getCategories());
  }, []);

  const handleDateChange = (date: Date | undefined, field: 'startDate' | 'endDate') => {
    if (date) {
      if (field === 'startDate') {
        setStartDate(date);
        setSale(prev => ({ ...prev, startDate: date.toISOString() }));
      } else {
        setEndDate(date);
        setSale(prev => ({ ...prev, endDate: date.toISOString() }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSale(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (value: 'item' | 'category' | 'flat') => {
    setSale(prev => ({ ...prev, type: value, target: value === 'flat' ? 'all' : '' }));
  };

  const handleTargetChange = (value: string) => {
    setSale(prev => ({ ...prev, target: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSale: Sale = {
      id: uuidv4(),
      ...sale,
      discount: Number(sale.discount),
    };
    const sales = storage.getSales();
    storage.saveSales([...sales, newSale]);
    router.push('/admin/sales');
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/sales">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 text-gray-900">
          Add New Sale
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Sale Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">Sale Name</label>
                <Input type="text" id="name" name="name" value={sale.name} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-900">Discount (%)</label>
                <Input type="number" id="discount" name="discount" value={sale.discount} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-900">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => handleDateChange(d, 'startDate')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-900">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => handleDateChange(d, 'endDate')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-900">Sale Type</label>
                <Select onValueChange={handleTypeChange} value={sale.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="target" className="block text-sm font-medium text-gray-900">Target</label>
                <Select onValueChange={handleTargetChange} value={sale.target} disabled={sale.type === 'flat'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a target" />
                  </SelectTrigger>
                  <SelectContent>
                    {sale.type === 'item' && products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    {sale.type === 'category' && categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link href="/admin/sales">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                Save Sale
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(NewSalePage, ['admin']);
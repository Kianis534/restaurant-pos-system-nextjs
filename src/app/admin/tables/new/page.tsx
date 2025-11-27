'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Table as TableType, Area } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { v4 as uuidv4 } from 'uuid';

const NewTablePage = () => {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [table, setTable] = useState<Omit<TableType, 'id'>>({
    name: '',
    capacity: 0,
    area: '',
  });
  const storage = new StorageService();

  useEffect(() => {
    setAreas(storage.getAreas());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTable(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAreaChange = (value: string) => {
    setTable(prev => ({
      ...prev,
      area: value === 'universal' ? '' : value,
    }));
  };

  const generateTableName = () => {
    const tables = storage.getTables();
    const tableNumbers = tables
      .map(t => t.name)
      .filter(name => name.startsWith('T'))
      .map(name => parseInt(name.substring(1), 10))
      .filter(num => !isNaN(num));
    
    const maxNumber = tableNumbers.length > 0 ? Math.max(...tableNumbers) : 0;
    const newNumber = maxNumber + 1;
    return `T${String(newNumber).padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newName = table.name.trim() === '' ? generateTableName() : table.name;
    const newTable: TableType = {
      id: uuidv4(),
      ...table,
      name: newName,
      capacity: Number(table.capacity),
    };
    const tables = storage.getTables();
    storage.saveTables([...tables, newTable]);
    router.push('/admin/tables');
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/tables">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 text-gray-900">
          Add New Table
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Table Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">Name (optional)</label>
                <Input type="text" id="name" name="name" value={table.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-900">Area</label>
                <Select onValueChange={handleAreaChange} value={table.area}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="universal">Universal</SelectItem>
                    {areas.map(area => (
                      <SelectItem key={area.id} value={area.name}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-900">Capacity</label>
                <Input type="number" id="capacity" name="capacity" value={table.capacity} onChange={handleChange} required />
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Link href="/admin/tables">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                Save Table
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(NewTablePage, ['admin']);
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import withAuth from '@/components/auth/withAuth';
import { Table as TableType, Area } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

const EditTablePage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [table, setTable] = useState<TableType | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const storage = new StorageService();

  useEffect(() => {
    if (id) {
      const tables = storage.getTables();
      const tableToEdit = tables.find(t => t.id === id);
      if (tableToEdit) {
        setTable(tableToEdit);
      }
    }
    setAreas(storage.getAreas());
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (table) {
      setTable({
        ...table,
        [name]: value,
      });
    }
  };
  
  const handleAreaChange = (value: string) => {
    if (table) {
      setTable({
        ...table,
        area: value === 'universal' ? '' : value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (table) {
      const updatedTable = {
        ...table,
        capacity: Number(table.capacity),
      };
      const tables = storage.getTables();
      const updatedTables = tables.map(t => t.id === id ? updatedTable : t);
      storage.saveTables(updatedTables);
      router.push('/admin/tables');
    }
  };

  if (!table) {
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
        <Link href="/admin/tables">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0 text-gray-900">
          Edit Table
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
                <Select onValueChange={handleAreaChange} value={table.area || 'universal'}>
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
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default withAuth(EditTablePage, ['admin']);
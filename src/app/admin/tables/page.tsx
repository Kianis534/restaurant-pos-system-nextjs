'use client';
import { useState, useEffect, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Table as TableType, Area } from '@/types';
import { StorageService } from '@/lib/storage';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function TableManagement() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const storage = new StorageService();

  useEffect(() => {
    setTables(storage.getTables());
    setAreas(storage.getAreas());
    setIsLoading(false);
  }, []);

  const handleTableDelete = (tableId: string) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      const updatedTables = tables.filter(t => t.id !== tableId);
      storage.saveTables(updatedTables);
      setTables(updatedTables);
    }
  };

  const handleAddArea = () => {
    if (newAreaName.trim() === '') {
      alert('Area name cannot be empty.');
      return;
    }
    const newArea: Area = {
      id: uuidv4(),
      name: newAreaName.trim(),
    };
    const updatedAreas = [...areas, newArea];
    storage.saveAreas(updatedAreas);
    setAreas(updatedAreas);
    setNewAreaName('');
  };

  const handleAreaDelete = (areaId: string) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      const areaToDelete = areas.find(a => a.id === areaId);
      if (!areaToDelete) return;

      const updatedTables = tables.map(table => {
        if (table.area === areaToDelete.name) {
          return { ...table, area: '' };
        }
        return table;
      });
      storage.saveTables(updatedTables);
      setTables(updatedTables);

      const updatedAreas = areas.filter(a => a.id !== areaId);
      storage.saveAreas(updatedAreas);
      setAreas(updatedAreas);
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter(table =>
      table && table.name && table.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tables, searchQuery]);

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
        <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
        <div className="space-x-4">
          <Link href="/admin/tables/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Table
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="relative w-full max-w-sm mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search tables by name..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-900">Name</TableHead>
                  <TableHead className="text-gray-900">Area</TableHead>
                  <TableHead className="text-gray-900">Capacity</TableHead>
                  <TableHead className="text-right text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map(table => {
                  return (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium text-gray-900">{table.name}</TableCell>
                      <TableCell className="text-gray-900">{table.area || 'Universal'}</TableCell>
                      <TableCell className="text-gray-900">{table.capacity}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/tables/edit/${table.id}`}>
                          <Button variant="ghost" size="sm" className="mr-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => handleTableDelete(table.id)}>
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
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Area Management</h2>
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Enter area name"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full"
                />
                <Button onClick={handleAddArea}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Existing Areas</CardTitle>
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
                  {areas.map(area => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium text-gray-900">{area.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleAreaDelete(area.id)}>
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

export default withAuth(TableManagement, ['admin']);
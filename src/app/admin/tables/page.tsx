'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { Edit, PlusCircle, Search, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Area, OrderItem, Table as TableType } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { validateName } from '@/lib/validation';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge, PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useFeedback } from '@/components/ui/Feedback';

const NO_TABLES: TableType[] = [];
const NO_AREAS: Area[] = [];
const NO_HELD: Record<string, OrderItem[]> = {};

function TablesPage() {
  const tables = useStoredData('tables', () => storage.getTables(), NO_TABLES);
  const areas = useStoredData('areas', () => storage.getAreas(), NO_AREAS);
  const held = useStoredData('heldTableOrders', () => storage.getHeldTableOrders(), NO_HELD);
  const [search, setSearch] = useState('');
  const [newArea, setNewArea] = useState('');
  const [areaError, setAreaError] = useState<string | null>(null);
  const { toast, confirm } = useFeedback();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...tables]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .filter((t) => !term || t.name.toLowerCase().includes(term) || t.area.toLowerCase().includes(term));
  }, [tables, search]);

  const removeTable = async (table: TableType) => {
    const open = (held[table.id] ?? []).length > 0;
    const ok = await confirm({
      title: `Delete table ${table.name}?`,
      description: open ? 'This table has an unpaid order, which will be discarded.' : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    storage.clearHeldTableOrder(table.id);
    storage.saveTables(storage.getTables().filter((t) => t.id !== table.id));
    toast(`Deleted table ${table.name}.`);
  };

  const addArea = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateName(newArea, areas, 'Area');
    setAreaError(problem);
    if (problem) return;
    storage.saveAreas([...areas, { id: uuidv4(), name: newArea.trim() }]);
    toast(`Added the "${newArea.trim()}" area.`);
    setNewArea('');
  };

  const removeArea = async (area: Area) => {
    const count = tables.filter((t) => t.area === area.name).length;
    const ok = await confirm({
      title: `Delete the "${area.name}" area?`,
      description: count ? `Its ${count} table${count === 1 ? '' : 's'} will move to "Any area".` : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    storage.saveTables(storage.getTables().map((t) => (t.area === area.name ? { ...t, area: '' } : t)));
    storage.saveAreas(storage.getAreas().filter((a) => a.id !== area.id));
    toast(`Deleted the "${area.name}" area.`);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Tables"
        description="Your floor plan: tables and the areas they belong to."
        actions={
          <LinkButton href="/admin/tables/new">
            <PlusCircle className="h-4 w-4" /> New table
          </LinkButton>
        }
      />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <Input
          type="search"
          className="pl-9"
          placeholder="Search by table or area"
          aria-label="Search tables"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-2 sm:pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.area || <span className="text-gray-500">Any area</span>}</TableCell>
                  <TableCell className="text-right">{t.capacity}</TableCell>
                  <TableCell>{(held[t.id] ?? []).length > 0 ? <Badge tone="amber">Open order</Badge> : <Badge tone="green">Free</Badge>}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <LinkButton href={`/admin/tables/edit?id=${encodeURIComponent(t.id)}`} variant="ghost" size="iconSm" aria-label={`Edit ${t.name}`}>
                      <Edit className="h-4 w-4" />
                    </LinkButton>
                    <Button variant="ghost" size="iconSm" onClick={() => removeTable(t)} aria-label={`Delete ${t.name}`}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 && <TableEmpty colSpan={5}>No tables match.</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addArea} className="flex max-w-md gap-2" noValidate>
            <Input placeholder="New area name" aria-label="New area name" value={newArea} onChange={(e) => setNewArea(e.target.value)} aria-invalid={!!areaError} />
            <Button type="submit">
              <PlusCircle className="h-4 w-4" /> Add
            </Button>
          </form>
          {areaError && (
            <p className="text-sm text-red-600" role="alert">
              {areaError}
            </p>
          )}
          <ul className="flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a.id} className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1 text-sm">
                {a.name}
                <span className="text-xs text-gray-500">({tables.filter((t) => t.area === a.name).length})</span>
                <button
                  type="button"
                  onClick={() => removeArea(a)}
                  className="rounded-full p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete area ${a.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {areas.length === 0 && <li className="text-sm text-gray-500">No areas yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(TablesPage, ['admin']);

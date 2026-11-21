'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Area, Table } from '@/types';
import { storage } from '@/lib/storage';
import { nextTableName, validateTable, type Errors } from '@/lib/validation';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';

export function TableForm({ table, areas, tables }: { table?: Table; areas: Area[]; tables: Table[] }) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: table?.name ?? '',
    area: table?.area ?? areas[0]?.name ?? '',
    capacity: table ? String(table.capacity) : '4',
  });
  const [errors, setErrors] = useState<Errors>({});
  const suggested = nextTableName(tables);
  const set = (field: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const all = storage.getTables();
    const others = all.filter((t) => t.id !== table?.id);
    const name = values.name.trim() || (table ? table.name : nextTableName(all));
    const problems = validateTable({ name, capacity: values.capacity }, others);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    const saved: Table = { id: table?.id ?? uuidv4(), name, area: values.area, capacity: Number(values.capacity) };
    storage.saveTables(table ? all.map((t) => (t.id === table.id ? saved : t)) : [...all, saved]);
    router.push('/admin/tables');
  };

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Name" htmlFor="name" error={errors.name} hint={table ? undefined : `Leave blank to use ${suggested}.`}>
              <Input id="name" value={values.name} placeholder={table ? undefined : suggested} onChange={set('name')} aria-invalid={!!errors.name} />
            </Field>
            <Field label="Area" htmlFor="area" hint="“Any area” shows the table under every area filter.">
              <Select id="area" value={values.area} onChange={set('area')}>
                <option value="">Any area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Seats" htmlFor="capacity" error={errors.capacity}>
              <Input id="capacity" type="number" inputMode="numeric" min="1" max="100" step="1" value={values.capacity} onChange={set('capacity')} aria-invalid={!!errors.capacity} required />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <LinkButton href="/admin/tables" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit">{table ? 'Save changes' : 'Add table'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Role, StoredUser, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/password';
import { validateEmployee, type Errors } from '@/lib/validation';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';

const ROLES: { value: Role; label: string }[] = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'admin', label: 'Admin' },
];

export function EmployeeForm({ employee }: { employee?: User }) {
  const router = useRouter();
  const { user: me, refreshUser } = useAuth();
  const [values, setValues] = useState({
    name: employee?.name ?? '',
    employeeNo: employee?.employeeNo ?? '',
    role: (employee?.role ?? 'cashier') as Role,
    email: employee?.email ?? '',
    phone: employee?.phone ?? '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (field: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const all = storage.getUsers();
    const others = all.filter((u) => u.id !== employee?.id);
    const problems = validateEmployee(values, others, { isNew: !employee });
    if (employee?.role === 'admin' && values.role !== 'admin' && !others.some((u) => u.role === 'admin')) {
      problems.role = 'This is the only admin. Make someone else an admin first.';
    }
    setErrors(problems);
    if (Object.keys(problems).length) return;

    setSaving(true);
    try {
      const existing = employee ? all.find((u) => u.id === employee.id) : undefined;
      const saved: StoredUser = {
        id: employee?.id ?? uuidv4(),
        name: values.name.trim(),
        employeeNo: values.employeeNo.trim(),
        role: values.role,
        email: values.email.trim(),
        phone: values.phone.trim(),
        passwordHash: values.password ? await hashPassword(values.password) : (existing?.passwordHash ?? ''),
      };
      storage.saveUsers(employee ? all.map((u) => (u.id === employee.id ? saved : u)) : [...all, saved]);
      if (employee?.id === me?.id) refreshUser();
      router.push('/admin/employees');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name}>
              <Input id="name" autoComplete="off" value={values.name} onChange={set('name')} aria-invalid={!!errors.name} required />
            </Field>
            <Field label="Employee number" htmlFor="employeeNo" error={errors.employeeNo} hint="Used to sign in.">
              <Input
                id="employeeNo"
                autoComplete="off"
                autoCapitalize="none"
                value={values.employeeNo}
                onChange={set('employeeNo')}
                aria-invalid={!!errors.employeeNo}
                required
              />
            </Field>
            <Field
              label={employee ? 'New password' : 'Password'}
              htmlFor="password"
              error={errors.password}
              hint={employee ? 'Leave blank to keep the current password.' : `At least ${MIN_PASSWORD_LENGTH} characters, no spaces.`}
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={set('password')}
                aria-invalid={!!errors.password}
                required={!employee}
              />
            </Field>
            <Field label="Role" htmlFor="role" error={errors.role}>
              <Select id="role" value={values.role} onChange={set('role')} aria-invalid={!!errors.role}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Email (optional)" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" autoComplete="off" value={values.email} onChange={set('email')} aria-invalid={!!errors.email} />
            </Field>
            <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" autoComplete="off" value={values.phone} onChange={set('phone')} aria-invalid={!!errors.phone} />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <LinkButton href="/admin/employees" variant="outline">
              Cancel
            </LinkButton>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : employee ? 'Save changes' : 'Add employee'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

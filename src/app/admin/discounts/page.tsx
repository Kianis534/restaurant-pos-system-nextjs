'use client';
import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import type { Discount, Product } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { storage } from '@/lib/storage';
import { discountStatus } from '@/lib/pricing';
import { formatDate } from '@/lib/format';
import { useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useFeedback } from '@/components/ui/Feedback';

const NO_DISCOUNTS: Discount[] = [];
const NO_PRODUCTS: Product[] = [];
const STATUS_TONE = { active: 'green', scheduled: 'blue', expired: 'gray' } as const;

/** yyyy-mm-dd as local midnight, so the displayed day doesn't shift with the time zone. */
const localDay = (key: string) => formatDate(`${key}T00:00:00`);

function DiscountsPage() {
  const discounts = useStoredData('discounts', () => storage.getDiscounts(), NO_DISCOUNTS);
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  const { toast, confirm } = useFeedback();

  const appliesTo = (d: Discount) => {
    if (d.type === 'all') return 'Whole menu';
    if (d.type === 'category') return `Category: ${d.target}`;
    return `Item: ${products.find((p) => p.id === d.target)?.name ?? 'deleted item'}`;
  };

  const remove = async (d: Discount) => {
    if (!(await confirm({ title: `Delete the "${d.name}" discount?`, confirmLabel: 'Delete', destructive: true }))) return;
    storage.saveDiscounts(storage.getDiscounts().filter((x) => x.id !== d.id));
    toast(`Deleted the "${d.name}" discount.`);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Discounts"
        description="Percentage-off promotions that apply automatically at the till."
        actions={
          <LinkButton href="/admin/discounts/new">
            <PlusCircle className="h-4 w-4" /> New discount
          </LinkButton>
        }
      />
      <Card>
        <CardContent className="pt-2 sm:pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead className="text-right">Off</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => {
                const status = discountStatus(d);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{appliesTo(d)}</TableCell>
                    <TableCell className="text-right">{d.percent}%</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {localDay(d.startDate)} – {localDay(d.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <LinkButton href={`/admin/discounts/edit?id=${encodeURIComponent(d.id)}`} variant="ghost" size="iconSm" aria-label={`Edit ${d.name}`}>
                        <Edit className="h-4 w-4" />
                      </LinkButton>
                      <Button variant="ghost" size="iconSm" onClick={() => remove(d)} aria-label={`Delete ${d.name}`}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {discounts.length === 0 && <TableEmpty colSpan={6}>No discounts yet.</TableEmpty>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(DiscountsPage, ['admin']);

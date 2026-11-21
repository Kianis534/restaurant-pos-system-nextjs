'use client';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ReactSelect from 'react-select';
import { Download, RotateCcw, Upload } from 'lucide-react';
import type { Product, Settings } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { seedSettings } from '@/lib/seed';
import { toLocalDateKey } from '@/lib/format';
import { downloadBlob } from '@/lib/download';
import { useHydrated, useStoredData } from '@/hooks/useStoredData';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Field, Label } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useFeedback } from '@/components/ui/Feedback';

const NO_PRODUCTS: Product[] = [];
const DEFAULT_SETTINGS: Settings = seedSettings();
type Option = { value: string; label: string };

function SettingsForm({ settings, products }: { settings: Settings; products: Product[] }) {
  const [taxPercent, setTaxPercent] = useState(String(Math.round(settings.taxRate * 10000) / 100));
  const [exempt, setExempt] = useState<string[]>(settings.taxExemptProductIds);
  const [header, setHeader] = useState(settings.receiptHeader);
  const [footer, setFooter] = useState(settings.receiptFooter);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useFeedback();
  const options: Option[] = products.map((p) => ({ value: p.id, label: p.name }));

  const save = (event: FormEvent) => {
    event.preventDefault();
    const rate = Number(taxPercent);
    if (taxPercent.trim() === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError('Tax rate must be between 0 and 100.');
      return;
    }
    storage.saveSettings({ taxRate: rate / 100, taxExemptProductIds: exempt, receiptHeader: header, receiptFooter: footer });
    setError(null);
    toast('Settings saved.');
  };

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Tax</CardTitle>
          <CardDescription>Applied to every sale after discounts. New orders use the new rate straight away.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label="Tax rate (%)" htmlFor="taxRate" error={error}>
            <Input
              id="taxRate"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              aria-invalid={!!error}
            />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="tax-exempt">Tax-free items</Label>
            <ReactSelect<Option, true>
              inputId="tax-exempt"
              instanceId="tax-exempt"
              isMulti
              options={options}
              value={options.filter((o) => exempt.includes(o.value))}
              onChange={(next) => setExempt(next.map((o) => o.value))}
              classNamePrefix="rs"
              placeholder="None"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
          <CardDescription>Printed at the top and bottom of every receipt. The first header line is printed in bold.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field label="Header" htmlFor="receiptHeader" hint="Restaurant name, address, phone...">
            <Textarea id="receiptHeader" rows={4} value={header} onChange={(e) => setHeader(e.target.value)} />
          </Field>
          <Field label="Footer" htmlFor="receiptFooter">
            <Textarea id="receiptFooter" rows={4} value={footer} onChange={(e) => setFooter(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit">Save settings</Button>
      </div>
    </form>
  );
}

function DataCard() {
  const router = useRouter();
  const { logout } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const { toast, confirm } = useFeedback();

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(storage.exportData(), null, 2)], { type: 'application/json' });
    downloadBlob(blob, `pos-backup-${toLocalDateKey(new Date())}.json`);
    toast('Backup downloaded. It contains password hashes, so keep it private.');
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ok = await confirm({
      title: 'Restore from this backup?',
      description: `Everything on this device will be replaced with "${file.name}". This cannot be undone, and you will be signed out.`,
      confirmLabel: 'Restore',
      destructive: true,
    });
    if (!ok) return;
    try {
      storage.importData(JSON.parse(await file.text()));
      logout();
      toast('Backup restored. Sign in with an account from the backup.');
      router.replace('/login');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'That file could not be read.', { tone: 'error' });
    }
  };

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset to demo data?',
      description: 'All orders, receipts, staff and menu changes on this device are deleted and the demo data is loaded again. You will be signed out.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    storage.resetToDemoData();
    logout();
    toast('Demo data restored.');
    router.replace('/login');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data on this device</CardTitle>
        <CardDescription>
          Everything is stored in this browser&apos;s local storage. Download a backup before clearing browser data or moving to another
          device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportBackup}>
            <Download className="h-4 w-4" /> Download backup
          </Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" /> Restore from backup
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} aria-label="Backup file" />
          <Button variant="destructive" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset to demo data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPage() {
  const hydrated = useHydrated();
  const settings = useStoredData('settings', () => storage.getSettings(), DEFAULT_SETTINGS);
  const products = useStoredData('products', () => storage.getProducts(), NO_PRODUCTS);
  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Tax, receipts and your data." />
      {hydrated ? <SettingsForm settings={settings} products={products} /> : <Spinner className="mx-auto" />}
      <DataCard />
    </AdminLayout>
  );
}

export default withAuth(SettingsPage, ['admin']);

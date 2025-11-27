'use client';
import { useState, useEffect } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Product } from '@/types';
import { StorageService } from '@/lib/storage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2 } from 'lucide-react';
import Select from 'react-select';

interface Settings {
  globalTaxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  taxExemptProductIds: string[];
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const storage = new StorageService();

  useEffect(() => {
    const currentSettings = storage.getSettings();
    setSettings(currentSettings);
    setProducts(storage.getProducts());
    setIsLoading(false);
  }, []);

  const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Number(value);
    if (settings) {
      setSettings({ ...settings, globalTaxRate: isNaN(numValue) ? 0 : numValue / 100 });
    }
  };

  const handleTaxExemptChange = (selected: any) => {
    if (settings) {
      setSettings({ ...settings, taxExemptProductIds: selected.map((s: any) => s.value) });
    }
  };

  const handleSaveSettings = () => {
    if (settings) {
      storage.saveSettings(settings);
      alert('Settings saved successfully!');
    }
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  const productOptions = products.map(p => ({ value: p.id, label: p.name }));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Tax Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="globalTaxRate" className="block text-sm font-medium text-gray-900">Global Tax Rate (%)</label>
            <Input
              type="number"
              id="globalTaxRate"
              value={isNaN(settings.globalTaxRate * 100) ? '' : settings.globalTaxRate * 100}
              onChange={handleTaxRateChange}
              className="w-full md:w-1/2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900">Tax Exempt Products</label>
            <Select
              isMulti
              options={productOptions}
              value={productOptions.filter(option => (settings.taxExemptProductIds || []).includes(option.value))}
              onChange={handleTaxExemptChange}
              className="mt-1"
              classNamePrefix="select"
            />
          </div>
          <Button onClick={handleSaveSettings}>Save Settings</Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

export default withAuth(SettingsPage, ['admin']);
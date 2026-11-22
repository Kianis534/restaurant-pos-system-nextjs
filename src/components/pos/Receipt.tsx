'use client';
import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import type { Receipt, Settings } from '@/types';
import { downloadReceiptPdf, receiptRows } from '@/lib/receipt';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useFeedback } from '@/components/ui/Feedback';

/** Thermal-receipt style view. The `print-area` class makes it the only thing that prints. */
export function ReceiptView({
  receipt,
  settings,
  printable = true,
}: {
  receipt: Receipt;
  settings: Settings;
  /** False for previews, so printing the page doesn't print a sample receipt. */
  printable?: boolean;
}) {
  const rows = receiptRows(receipt, settings);
  return (
    <div
      className={cn('mx-auto w-full max-w-[80mm] bg-white p-4 font-mono text-[11px] leading-snug text-black', printable && 'print-area')}
      data-testid={printable ? 'receipt' : undefined}
    >
      {rows.map((row, i) => {
        if (row.kind === 'rule') return <hr key={i} className="my-1.5 border-t border-dashed border-gray-500" />;
        if (row.kind === 'center')
          return (
            <p key={i} className={cn('text-center', row.bold && 'text-sm font-bold')}>
              {row.left}
            </p>
          );
        return (
          <div key={i} className={cn('flex justify-between gap-3', row.bold && 'font-bold', row.kind === 'total' && 'text-[13px]')}>
            <span className="whitespace-pre-wrap break-words">{row.left}</span>
            {row.right && <span className="shrink-0 text-right">{row.right}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function ReceiptActions({ receipt, settings, children }: { receipt: Receipt; settings: Settings; children?: React.ReactNode }) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useFeedback();
  const download = async () => {
    setDownloading(true);
    try {
      await downloadReceiptPdf(receipt, settings);
    } catch (error) {
      console.error(error);
      toast('Could not create the PDF. Try printing instead.', { tone: 'error' });
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className="no-print mt-4 flex flex-wrap gap-2">
      <Button onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print
      </Button>
      <Button variant="outline" onClick={download} disabled={downloading}>
        <Download className="h-4 w-4" /> {downloading ? 'Preparing...' : 'Download PDF'}
      </Button>
      {children}
    </div>
  );
}

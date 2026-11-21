import type { Receipt, Settings } from '@/types';
import { capitalize, formatDateTime, formatMoney } from './format';

/** Plain rows that both the on-screen receipt and the PDF are drawn from. */
export interface ReceiptRow {
  kind: 'center' | 'pair' | 'item' | 'rule' | 'total';
  left?: string;
  right?: string;
  bold?: boolean;
}

export function paymentLabel(method: Receipt['paymentMethod']): string {
  return method === 'split' ? 'Split (cash + card)' : capitalize(method);
}

export function receiptRows(receipt: Receipt, settings: Pick<Settings, 'receiptHeader' | 'receiptFooter'>): ReceiptRow[] {
  const rows: ReceiptRow[] = [];
  const headerLines = settings.receiptHeader.split('\n').map((l) => l.trim()).filter(Boolean);
  headerLines.forEach((line, i) => rows.push({ kind: 'center', left: line, bold: i === 0 }));
  if (headerLines.length) rows.push({ kind: 'rule' });

  rows.push({ kind: 'pair', left: 'Order', right: receipt.orderNumber || receipt.orderId });
  rows.push({ kind: 'pair', left: 'Receipt', right: receipt.id });
  rows.push({ kind: 'pair', left: 'Date', right: formatDateTime(receipt.date) });
  rows.push({ kind: 'pair', left: 'Cashier', right: receipt.employeeName });
  rows.push({
    kind: 'pair',
    left: 'Type',
    right: receipt.orderType === 'dine-in' ? `Dine-in${receipt.tableName ? ` (${receipt.tableName})` : ''}` : 'Takeaway',
  });
  rows.push({ kind: 'rule' });

  for (const item of receipt.items) {
    rows.push({ kind: 'item', left: item.productName, right: formatMoney(item.total), bold: true });
    rows.push({ kind: 'item', left: `  ${item.quantity} x ${formatMoney(item.price)}` });
    if (item.discount > 0) rows.push({ kind: 'item', left: `  Discount -${formatMoney(item.discount * item.quantity)}` });
  }
  rows.push({ kind: 'rule' });

  rows.push({ kind: 'pair', left: 'Subtotal', right: formatMoney(receipt.subtotal) });
  if (receipt.discount > 0) rows.push({ kind: 'pair', left: 'Discount', right: `-${formatMoney(receipt.discount)}` });
  rows.push({ kind: 'pair', left: 'Tax', right: formatMoney(receipt.tax) });
  rows.push({ kind: 'total', left: 'TOTAL', right: formatMoney(receipt.total), bold: true });
  rows.push({ kind: 'rule' });

  rows.push({ kind: 'pair', left: 'Paid by', right: paymentLabel(receipt.paymentMethod) });
  if (receipt.paymentMethod === 'cash') {
    if (receipt.cashTendered !== undefined) rows.push({ kind: 'pair', left: 'Cash received', right: formatMoney(receipt.cashTendered) });
    if (receipt.changeDue !== undefined) rows.push({ kind: 'pair', left: 'Change', right: formatMoney(receipt.changeDue) });
  } else if (receipt.paymentMethod === 'split') {
    rows.push({ kind: 'pair', left: 'Cash', right: formatMoney(receipt.cashAmount ?? 0) });
    rows.push({ kind: 'pair', left: 'Card', right: formatMoney(receipt.cardAmount ?? 0) });
  }

  const footerLines = settings.receiptFooter.split('\n').map((l) => l.trim()).filter(Boolean);
  if (footerLines.length) {
    rows.push({ kind: 'rule' });
    footerLines.forEach((line) => rows.push({ kind: 'center', left: line }));
  }
  return rows;
}

/** jsPDF's built-in fonts only cover Latin-1, so swap anything else (e.g. ₹) for "?" rather than garbage. */
function pdfSafe(text: string): string {
  return text.replace(/[^\x20-\xff]/g, '?');
}

/** Draws the receipt as real text on an 80 mm thermal-roll page and downloads it. */
export async function downloadReceiptPdf(receipt: Receipt, settings: Settings): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const rows = receiptRows(receipt, settings);
  const width = 80;
  const margin = 5;
  const lineHeight = 4.2;
  const contentWidth = width - margin * 2;

  // Measure first so the page is exactly as long as the receipt.
  const measure = new jsPDF({ unit: 'mm', format: [width, 200] });
  measure.setFont('courier', 'normal').setFontSize(8.5);
  const wrapped = rows.map((row) =>
    row.kind === 'rule' ? [''] : (measure.splitTextToSize(pdfSafe(row.left ?? ''), row.right ? contentWidth * 0.62 : contentWidth) as string[]),
  );
  const height = margin * 2 + wrapped.reduce((sum, lines) => sum + lines.length * lineHeight, 0);

  const doc = new jsPDF({ unit: 'mm', format: [width, Math.max(60, height)] });
  doc.setFont('courier', 'normal').setFontSize(8.5);
  let y = margin + 3;
  rows.forEach((row, i) => {
    doc.setFont('courier', row.bold ? 'bold' : 'normal');
    if (row.kind === 'rule') {
      doc.setLineDashPattern([1, 1], 0).setLineWidth(0.2).line(margin, y - 1.5, width - margin, y - 1.5);
      y += lineHeight;
      return;
    }
    wrapped[i].forEach((line, lineIndex) => {
      if (row.kind === 'center') doc.text(line, width / 2, y, { align: 'center' });
      else doc.text(line, margin, y);
      if (lineIndex === 0 && row.right) doc.text(pdfSafe(row.right), width - margin, y, { align: 'right' });
      y += lineHeight;
    });
  });

  doc.save(`receipt-${receipt.orderNumber || receipt.id}.pdf`);
}

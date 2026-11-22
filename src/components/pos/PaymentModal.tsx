'use client';
import { useState, type FormEvent } from 'react';
import { Banknote, CreditCard, SplitSquareHorizontal } from 'lucide-react';
import type { PaymentMethod } from '@/types';
import { validatePayment, type PaymentInput } from '@/lib/checkout';
import { roundMoney } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';

interface PaymentModalProps {
  isOpen: boolean;
  total: number;
  onClose: () => void;
  /** Returns an error message to show, or null when the sale went through. */
  onConfirm: (payment: PaymentInput) => string | null;
}

export function PaymentModal({ isOpen, total, onClose, onConfirm }: PaymentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Take payment" description={`Total due: ${formatMoney(total)}`}>
      {/* Remounts each time the dialog opens, so the form always starts fresh. */}
      <PaymentForm total={total} onCancel={onClose} onConfirm={onConfirm} />
    </Modal>
  );
}

const METHODS: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'split', label: 'Split', icon: SplitSquareHorizontal },
];

const toNumber = (value: string) => (value.trim() === '' ? NaN : Number(value));

function quickCashAmounts(total: number): number[] {
  const options = new Set<number>();
  for (const step of [5, 10, 20, 50, 100]) {
    const rounded = Math.ceil(total / step) * step;
    if (rounded > total) options.add(rounded);
  }
  return Array.from(options).slice(0, 3);
}

function PaymentForm({ total, onCancel, onConfirm }: { total: number; onCancel: () => void; onConfirm: PaymentModalProps['onConfirm'] }) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tendered, setTendered] = useState(total.toFixed(2));
  const [cash, setCash] = useState('0.00');
  const [card, setCard] = useState(total.toFixed(2));
  const [error, setError] = useState<string | null>(null);

  const tenderedValue = toNumber(tendered);
  const change = Number.isFinite(tenderedValue) ? roundMoney(tenderedValue - total) : NaN;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payment: PaymentInput =
      method === 'cash'
        ? { method, cashTendered: tenderedValue }
        : method === 'card'
          ? { method }
          : { method, cashAmount: toNumber(cash), cardAmount: toNumber(card) };
    const problem = validatePayment(total, payment);
    if (problem) {
      setError(problem);
      return;
    }
    setError(onConfirm(payment));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-900">Payment method</legend>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(({ id, label, icon: Icon }) => (
            <label
              key={id}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-md border p-3 text-sm font-medium',
                method === id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50',
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={id}
                checked={method === id}
                onChange={() => {
                  setMethod(id);
                  setError(null);
                }}
                className="sr-only"
              />
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {method === 'cash' && (
        <div className="space-y-3">
          <Field label="Cash received" htmlFor="cash-tendered">
            <Input
              id="cash-tendered"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              // Ready to type over: the cashier enters the amount handed over and presses Enter.
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setTendered(total.toFixed(2))}>
              Exact
            </Button>
            {quickCashAmounts(total).map((amount) => (
              <Button key={amount} variant="outline" size="sm" onClick={() => setTendered(amount.toFixed(2))}>
                {formatMoney(amount)}
              </Button>
            ))}
          </div>
          <p className="text-sm text-gray-700">
            Change due:{' '}
            <span className="font-semibold" data-testid="change-due">
              {Number.isFinite(change) && change >= 0 ? formatMoney(change) : '-'}
            </span>
          </p>
        </div>
      )}

      {method === 'card' && <p className="text-sm text-gray-700">Charge {formatMoney(total)} to the card terminal, then confirm.</p>}

      {method === 'split' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cash" htmlFor="split-cash">
            <Input
              id="split-cash"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cash}
              onChange={(e) => {
                setCash(e.target.value);
                const n = toNumber(e.target.value);
                if (Number.isFinite(n)) setCard(Math.max(0, roundMoney(total - n)).toFixed(2));
              }}
            />
          </Field>
          <Field label="Card" htmlFor="split-card">
            <Input
              id="split-card"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={card}
              onChange={(e) => {
                setCard(e.target.value);
                const n = toNumber(e.target.value);
                if (Number.isFinite(n)) setCash(Math.max(0, roundMoney(total - n)).toFixed(2));
              }}
            />
          </Field>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Confirm payment</Button>
      </div>
    </form>
  );
}

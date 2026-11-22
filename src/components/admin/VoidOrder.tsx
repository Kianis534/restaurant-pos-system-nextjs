'use client';
import { useState, type FormEvent } from 'react';
import { Ban } from 'lucide-react';
import type { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/lib/storage';
import { formatDateTime, formatMoney } from '@/lib/format';
import { MAX_VOID_NOTE, VOID_REASONS, validateVoid } from '@/lib/voids';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { useFeedback } from '@/components/ui/Feedback';

/** Red notice shown on a voided order or bill. */
export function VoidedNotice({ voidedAt, voidedBy, voidReason }: Pick<Order, 'voidedAt' | 'voidedBy' | 'voidReason'>) {
  if (!voidedAt) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="status">
      <p className="font-semibold">Voided{voidedBy ? ` by ${voidedBy}` : ''} on {formatDateTime(voidedAt)}</p>
      {voidReason && <p className="mt-0.5">Reason: {voidReason}</p>}
      <p className="mt-0.5 text-red-700">Not counted in revenue. Its items went back into stock.</p>
    </div>
  );
}

/** "Void order" for admins. Renders nothing for other roles or an order that's already voided. */
export function VoidOrderButton({ order, className }: { order: Order; className?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user || user.role !== 'admin' || order.status === 'cancelled') return null;
  return (
    <>
      <Button variant="destructive" className={className} onClick={() => setOpen(true)}>
        <Ban className="h-4 w-4" /> Void order
      </Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Void ${order.orderNumber}?`}
        description={`${formatMoney(order.total)} comes off revenue and the items go back into stock. The order stays in the history.`}
      >
        {/* Remounts each time, so the form starts empty. */}
        <VoidForm order={order} by={user.name} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function VoidForm({ order, by, onDone }: { order: Order; by: string; onDone: () => void }) {
  const { toast } = useFeedback();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateVoid(order, { reason, note });
    if (problem) {
      setError(problem);
      return;
    }
    try {
      storage.voidOrder(order.id, { reason, note, by });
      onDone();
      toast(`${order.orderNumber} voided. Its items are back in stock.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The order could not be voided.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Reason" htmlFor="void-reason" error={error && !reason ? error : null}>
        <Select
          id="void-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          aria-invalid={!!error && !reason}
          required
        >
          <option value="">Choose a reason...</option>
          {VOID_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note (optional)" htmlFor="void-note" hint="Printed on the receipt next to the reason.">
        <Textarea id="void-note" rows={2} maxLength={MAX_VOID_NOTE} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && reason && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>
          Keep order
        </Button>
        <Button type="submit" variant="destructive">
          Void order
        </Button>
      </div>
    </form>
  );
}

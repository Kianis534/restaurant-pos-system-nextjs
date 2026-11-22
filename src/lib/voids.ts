import type { Order } from '@/types';

/**
 * Voiding a paid order: the order is kept (for the audit trail) but marked as cancelled with
 * who, when and why. Revenue, best sellers and the kitchen only count completed orders, and
 * StorageService.voidOrder() puts the items back into stock.
 */

export const VOID_REASONS = [
  'Wrong order entered',
  'Customer changed their mind',
  'Payment problem',
  'Complaint about food or service',
  'Other',
] as const;

export const MAX_VOID_NOTE = 200;

export interface VoidInput {
  /** One of VOID_REASONS. */
  reason: string;
  /** Optional detail, e.g. "rang up twice". */
  note?: string;
  /** Name of the admin voiding the order. */
  by: string;
  now?: Date;
}

/** The reason as stored and printed: "Wrong order entered: rang up twice". */
export function voidReasonText(reason: string, note?: string): string {
  const detail = note?.trim();
  return detail ? `${reason.trim()}: ${detail}` : reason.trim();
}

/** Returns an error message, or null when the input can be used. */
export function validateVoid(order: Pick<Order, 'status' | 'orderNumber'>, input: Pick<VoidInput, 'reason' | 'note'>): string | null {
  if (order.status === 'cancelled') return `${order.orderNumber} is already voided.`;
  if (!input.reason.trim()) return 'Choose a reason.';
  if ((input.note ?? '').trim().length > MAX_VOID_NOTE) return `Keep the note under ${MAX_VOID_NOTE} characters.`;
  return null;
}

/** The voided copy of an order. Throws if it can't be voided. */
export function markVoided(order: Order, input: VoidInput): Order {
  const problem = validateVoid(order, input);
  if (problem) throw new Error(problem);
  return {
    ...order,
    status: 'cancelled',
    voidedAt: (input.now ?? new Date()).toISOString(),
    voidedBy: input.by,
    voidReason: voidReasonText(input.reason, input.note),
  };
}

export function isVoided(order: Pick<Order, 'status'>): boolean {
  return order.status === 'cancelled';
}

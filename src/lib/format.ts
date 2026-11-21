import { config } from './config';

function buildMoneyFormatter(locale: string, currency: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency });
  } catch {
    // An invalid NEXT_PUBLIC_CURRENCY or NEXT_PUBLIC_LOCALE shouldn't take the whole app down.
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  }
}

const moneyFormatter = buildMoneyFormatter(config.locale, config.currency);

export function formatMoney(amount: number): string {
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(config.locale);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString(config.locale);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleTimeString(config.locale, { hour: '2-digit', minute: '2-digit' });
}

/** Today's date as yyyy-mm-dd in the browser's local time zone. */
export function todayLocal(now: Date = new Date()): string {
  return toLocalDateKey(now);
}

/** A Date as yyyy-mm-dd in local time (not UTC, which is what toISOString gives). */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

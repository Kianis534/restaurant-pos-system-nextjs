import type { Discount, Product, Role, StoredUser, Table } from '@/types';
import { validatePassword } from './password';

/** Field name -> error message. Empty object means valid. */
export type Errors = Record<string, string>;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Drops one field's error, e.g. as soon as the user edits that field. */
export function clearError(errors: Errors, field: string): Errors {
  if (!(field in errors)) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

/** True when a money amount has at most two decimal places (12, 12.5, 12.50 but not 12.505). */
export function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

function parseNumber(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  return raw.trim() === '' ? NaN : Number(raw);
}

export interface ProductInput {
  name: string;
  category: string;
  price: string | number;
  cost: string | number;
  quantity: string | number;
  sku?: string;
  description?: string;
}

export function validateProduct(input: ProductInput, others: Product[]): Errors {
  const errors: Errors = {};
  const price = parseNumber(input.price);
  const cost = parseNumber(input.cost);
  const quantity = parseNumber(input.quantity);
  if (!input.name.trim()) errors.name = 'Name is required.';
  else if (others.some((p) => same(p.name, input.name))) errors.name = 'Another menu item already has this name.';
  if (!Number.isFinite(price) || price < 0) errors.price = 'Enter a price of 0 or more.';
  else if (price > 100_000) errors.price = 'That price looks too high.';
  else if (!hasAtMostTwoDecimals(price)) errors.price = 'Use at most two decimal places.';
  if (!Number.isFinite(cost) || cost < 0) errors.cost = 'Enter a cost of 0 or more.';
  else if (!hasAtMostTwoDecimals(cost)) errors.cost = 'Use at most two decimal places.';
  if (!Number.isInteger(quantity) || quantity < 0) errors.quantity = 'Stock must be a whole number, 0 or more.';
  if (input.sku && others.some((p) => p.sku && same(p.sku, input.sku ?? ''))) errors.sku = 'Another item already uses this SKU.';
  return errors;
}

export function validateDeal(input: { name: string; price: string | number; items: string[] }, others: Product[]): Errors {
  const errors: Errors = {};
  const price = parseNumber(input.price);
  if (!input.name.trim()) errors.name = 'Name is required.';
  else if (others.some((p) => same(p.name, input.name))) errors.name = 'Another menu item already has this name.';
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Enter a deal price above 0.';
  else if (!hasAtMostTwoDecimals(price)) errors.price = 'Use at most two decimal places.';
  if (input.items.length < 2) errors.items = 'Pick at least two items for the deal.';
  return errors;
}

export interface EmployeeInput {
  name: string;
  employeeNo: string;
  role: Role;
  email: string;
  phone: string;
  password: string;
}

export function validateEmployee(input: EmployeeInput, others: StoredUser[], { isNew }: { isNew: boolean }): Errors {
  const errors: Errors = {};
  if (!input.name.trim()) errors.name = 'Name is required.';
  if (!input.employeeNo.trim()) errors.employeeNo = 'Employee number is required.';
  else if (/\s/.test(input.employeeNo.trim())) errors.employeeNo = 'Employee number cannot contain spaces.';
  else if (others.some((u) => same(u.employeeNo, input.employeeNo))) errors.employeeNo = 'This employee number is already taken.';
  if (isNew || input.password) {
    const problem = validatePassword(input.password);
    if (problem) errors.password = problem;
  }
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.';
  if (input.phone.trim() && !/^\+?[0-9 ()-]{7,20}$/.test(input.phone.trim())) errors.phone = 'Enter a valid phone number.';
  return errors;
}

export function validateTable(input: { name: string; capacity: string | number }, others: Table[]): Errors {
  const errors: Errors = {};
  const capacity = parseNumber(input.capacity);
  if (input.name.trim() && others.some((t) => same(t.name, input.name))) errors.name = 'Another table already has this name.';
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) errors.capacity = 'Seats must be a whole number from 1 to 100.';
  return errors;
}

export function validateDiscount(input: Omit<Discount, 'id' | 'percent'> & { percent: string | number }): Errors {
  const errors: Errors = {};
  const percent = parseNumber(input.percent);
  if (!input.name.trim()) errors.name = 'Name is required.';
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) errors.percent = 'Enter a percentage between 1 and 100.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) errors.startDate = 'Pick a start date.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) errors.endDate = 'Pick an end date.';
  else if (input.endDate < input.startDate) errors.endDate = 'The end date must be on or after the start date.';
  if (input.type !== 'all' && !input.target) errors.target = input.type === 'item' ? 'Pick a menu item.' : 'Pick a category.';
  return errors;
}

/** For simple named lists (categories, areas). Returns an error message or null. */
export function validateName(name: string, existing: { name: string }[], label: string): string | null {
  if (!name.trim()) return `${label} name cannot be empty.`;
  if (existing.some((e) => same(e.name, name))) return `${label} "${name.trim()}" already exists.`;
  return null;
}

/** Suggests the next free table name: T01, T02, ... */
export function nextTableName(tables: Table[]): string {
  const numbers = tables.map((t) => /^T(\d+)$/i.exec(t.name.trim())).filter(Boolean).map((m) => Number(m![1]));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `T${String(next).padStart(2, '0')}`;
}

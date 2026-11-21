import { describe, expect, it } from 'vitest';
import { nextTableName, validateDeal, validateDiscount, validateEmployee, validateName, validateProduct, validateTable } from '@/lib/validation';
import type { StoredUser } from '@/types';
import { products } from './fixtures';

describe('validateProduct', () => {
  const good = { name: 'Soup', category: 'Starters', price: '4.5', cost: '1', quantity: '10' };
  it('accepts a valid item', () => {
    expect(validateProduct(good, products)).toEqual({});
  });
  it('flags missing, negative, fractional and duplicate values', () => {
    expect(validateProduct({ ...good, name: ' ' }, products).name).toBe('Name is required.');
    expect(validateProduct({ ...good, name: 'burger' }, products).name).toMatch(/already has this name/);
    expect(validateProduct({ ...good, price: '-1' }, products).price).toBeDefined();
    expect(validateProduct({ ...good, price: '' }, products).price).toBeDefined();
    expect(validateProduct({ ...good, quantity: '1.5' }, products).quantity).toBeDefined();
  });
});

describe('validateDeal', () => {
  it('needs a name, a positive price and two items', () => {
    expect(validateDeal({ name: 'Lunch', price: '9', items: ['burger', 'fries'] }, products)).toEqual({});
    expect(Object.keys(validateDeal({ name: '', price: '0', items: ['burger'] }, products)).sort()).toEqual(['items', 'name', 'price']);
  });
});

describe('validateEmployee', () => {
  const existing = [{ employeeNo: 'cashier001' }] as StoredUser[];
  const input = { name: 'Sam', employeeNo: 'sam01', role: 'cashier' as const, email: '', phone: '', password: 'secret12' };
  it('accepts a valid new employee', () => {
    expect(validateEmployee(input, existing, { isNew: true })).toEqual({});
  });
  it('requires a password for new staff only', () => {
    expect(validateEmployee({ ...input, password: '' }, existing, { isNew: true }).password).toBeDefined();
    expect(validateEmployee({ ...input, password: '' }, existing, { isNew: false })).toEqual({});
  });
  it('catches taken numbers, spaces, bad email and bad phone', () => {
    expect(validateEmployee({ ...input, employeeNo: 'CASHIER001' }, existing, { isNew: true }).employeeNo).toMatch(/taken/);
    expect(validateEmployee({ ...input, employeeNo: 'a b' }, existing, { isNew: true }).employeeNo).toMatch(/spaces/);
    expect(validateEmployee({ ...input, email: 'nope' }, existing, { isNew: true }).email).toBeDefined();
    expect(validateEmployee({ ...input, phone: 'call me' }, existing, { isNew: true }).phone).toBeDefined();
    expect(validateEmployee({ ...input, phone: '+1 (555) 010-0199' }, existing, { isNew: true }).phone).toBeUndefined();
  });
});

describe('tables, discounts and names', () => {
  const tables = [{ id: '1', name: 'T01', area: '', capacity: 2 }, { id: '2', name: 'T09', area: '', capacity: 2 }, { id: '3', name: 'Bar', area: '', capacity: 2 }];
  it('validates table seats and names', () => {
    expect(validateTable({ name: 'T10', capacity: '4' }, tables)).toEqual({});
    expect(validateTable({ name: 't01', capacity: '4' }, tables).name).toBeDefined();
    expect(validateTable({ name: 'X', capacity: '0' }, tables).capacity).toBeDefined();
  });
  it('suggests the next table number', () => {
    expect(nextTableName(tables)).toBe('T10');
    expect(nextTableName([])).toBe('T01');
  });
  it('validates discounts', () => {
    const d = { name: 'Lunch', type: 'item' as const, percent: '20', startDate: '2026-06-01', endDate: '2026-06-30', target: 'burger' };
    expect(validateDiscount(d)).toEqual({});
    expect(validateDiscount({ ...d, percent: '150' }).percent).toBeDefined();
    expect(validateDiscount({ ...d, endDate: '2026-05-01' }).endDate).toMatch(/on or after/);
    expect(validateDiscount({ ...d, target: undefined }).target).toBe('Pick a menu item.');
  });
  it('validates simple names', () => {
    expect(validateName('  ', [], 'Area')).toMatch(/cannot be empty/);
    expect(validateName('terrace', [{ name: 'Terrace' }], 'Area')).toBe('Area "terrace" already exists.');
    expect(validateName('Patio', [{ name: 'Terrace' }], 'Area')).toBeNull();
  });
});

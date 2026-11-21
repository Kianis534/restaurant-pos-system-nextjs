import type { Area, Category, Discount, Product, Settings, StoredUser, Table } from '@/types';
import { config } from './config';
import { toLocalDateKey } from './format';

/**
 * Demo data loaded into localStorage the first time the app opens in a browser.
 *
 * Demo logins (shown on the sign-in page unless NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false):
 *   admin001   / admin123
 *   cashier001 / cashier123
 *   kitchen001 / kitchen123
 *
 * Only PBKDF2 hashes are stored here, never the passwords themselves. To ship different
 * passwords, generate hashes with `npm run hash-password -- "..."` and put them in
 * NEXT_PUBLIC_ADMIN_PASSWORD_HASH / NEXT_PUBLIC_STAFF_PASSWORD_HASH.
 */

const DEMO_ADMIN_HASH =
  'pbkdf2-sha256:100000:9e421faf5b81fde78c0246a73ce9540d:eda19230261c66bb923b6e9a80c0e4f3d5dd1bce610cac32c228a7451649215c';
const DEMO_CASHIER_HASH =
  'pbkdf2-sha256:100000:519b134cc2359e2f377997b940f74c9c:5644e29b2dfd88ae01f6518c58d01f0a520e083e7f4d31d8f0e271ef163ce969';
const DEMO_KITCHEN_HASH =
  'pbkdf2-sha256:100000:ceaabb90ca1432c20805a2e2e0f4a2a9:7f6c6da2d2c716face64011585d1f0129d2d9b82540317afaaca47a0f1a15ff3';

export const DEMO_ACCOUNTS = [
  { role: 'Admin', employeeNo: 'admin001', password: 'admin123' },
  { role: 'Cashier', employeeNo: 'cashier001', password: 'cashier123' },
  { role: 'Kitchen', employeeNo: 'kitchen001', password: 'kitchen123' },
] as const;

export function seedUsers(): StoredUser[] {
  const admin = config.adminPasswordHash || DEMO_ADMIN_HASH;
  return [
    {
      id: 'user-admin',
      employeeNo: 'admin001',
      name: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
      phone: '+1 555 0100',
      passwordHash: admin,
    },
    {
      id: 'user-cashier-1',
      employeeNo: 'cashier001',
      name: 'Front Desk Cashier',
      role: 'cashier',
      email: 'cashier@example.com',
      phone: '+1 555 0101',
      passwordHash: config.staffPasswordHash || DEMO_CASHIER_HASH,
    },
    {
      id: 'user-kitchen-1',
      employeeNo: 'kitchen001',
      name: 'Kitchen Display',
      role: 'kitchen',
      email: 'kitchen@example.com',
      phone: '+1 555 0102',
      passwordHash: config.staffPasswordHash || DEMO_KITCHEN_HASH,
    },
  ];
}

export const seedCategories: Category[] = [
  { id: 'cat-mains', name: 'Main Course' },
  { id: 'cat-starters', name: 'Starters' },
  { id: 'cat-drinks', name: 'Drinks' },
  { id: 'cat-desserts', name: 'Desserts' },
];

export const seedProducts: Product[] = [
  { id: 'p-burger', name: 'Classic Burger', category: 'Main Course', price: 12.99, cost: 4.5, quantity: 100, sku: 'MAIN-001', description: 'Beef patty, lettuce, tomato and cheese' },
  { id: 'p-pizza', name: 'Margherita Pizza', category: 'Main Course', price: 15.99, cost: 5, quantity: 50, sku: 'MAIN-002', description: 'Tomato, mozzarella and basil' },
  { id: 'p-pasta', name: 'Chicken Alfredo', category: 'Main Course', price: 14.5, cost: 4.8, quantity: 40, sku: 'MAIN-003' },
  { id: 'p-steak', name: 'Grilled Steak', category: 'Main Course', price: 24.0, cost: 10, quantity: 25, sku: 'MAIN-004' },
  { id: 'p-salad', name: 'Caesar Salad', category: 'Starters', price: 8.99, cost: 2.5, quantity: 75, sku: 'START-001' },
  { id: 'p-wings', name: 'Hot Wings', category: 'Starters', price: 9.5, cost: 3.2, quantity: 60, sku: 'START-002' },
  { id: 'p-fries', name: 'Fries', category: 'Starters', price: 3.99, cost: 0.9, quantity: 150, sku: 'START-003' },
  { id: 'p-cola', name: 'Cola', category: 'Drinks', price: 2.5, cost: 0.75, quantity: 200, sku: 'DRINK-001', description: '330 ml can' },
  { id: 'p-lemonade', name: 'Fresh Lemonade', category: 'Drinks', price: 3.5, cost: 0.8, quantity: 80, sku: 'DRINK-002' },
  { id: 'p-water', name: 'Mineral Water', category: 'Drinks', price: 1.5, cost: 0.3, quantity: 200, sku: 'DRINK-003' },
  { id: 'p-cake', name: 'Chocolate Cake', category: 'Desserts', price: 6.5, cost: 2, quantity: 30, sku: 'DES-001' },
  { id: 'p-icecream', name: 'Vanilla Ice Cream', category: 'Desserts', price: 4.5, cost: 1.2, quantity: 45, sku: 'DES-002' },
  {
    id: 'deal-burger-combo',
    name: 'Burger Combo',
    category: 'Deals',
    price: 16.99,
    cost: 0,
    quantity: 0,
    isDeal: true,
    dealItems: ['p-burger', 'p-fries', 'p-cola'],
  },
];

export const seedAreas: Area[] = [
  { id: 'area-main', name: 'Main Hall' },
  { id: 'area-terrace', name: 'Terrace' },
  { id: 'area-vip', name: 'VIP Room' },
];

export const seedTables: Table[] = [
  { id: 't-01', name: 'T01', area: 'Main Hall', capacity: 4 },
  { id: 't-02', name: 'T02', area: 'Main Hall', capacity: 4 },
  { id: 't-03', name: 'T03', area: 'Main Hall', capacity: 6 },
  { id: 't-04', name: 'T04', area: 'Terrace', capacity: 2 },
  { id: 't-05', name: 'T05', area: 'Terrace', capacity: 2 },
  { id: 't-06', name: 'T06', area: 'VIP Room', capacity: 8 },
];

/** One running promotion so the discount logic is visible straight away. */
export function seedDiscounts(now: Date = new Date()): Discount[] {
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  return [
    {
      id: 'disc-desserts',
      name: 'Dessert Week',
      type: 'category',
      percent: 15,
      startDate: toLocalDateKey(now),
      endDate: toLocalDateKey(end),
      target: 'Desserts',
    },
  ];
}

export function seedSettings(): Settings {
  return {
    taxRate: 0.1,
    taxExemptProductIds: ['p-water'],
    receiptHeader: `${config.appName}\n123 Main Street\nTel: +1 555 0100`,
    receiptFooter: 'Thank you for dining with us!',
  };
}

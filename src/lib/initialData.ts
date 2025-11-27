import { User, Product, Table, Area, Category, Sale } from '@/types';
import { StorageService } from './storage';

export const initialUsers: User[] = [
  {
    id: '1',
    employeeNo: 'admin001',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    email: 'admin@restaurant.com',
    phone: '+1234567890'
  },
  {
    id: '2',
    employeeNo: 'cashier001',
    password: 'cashier123',
    name: 'John Doe',
    role: 'cashier',
    email: 'john@restaurant.com',
    phone: '+1234567891'
  },
  {
    id: '3',
    employeeNo: 'cashier002',
    password: 'cashier123',
    name: 'Jane Smith',
    role: 'cashier',
    email: 'jane@restaurant.com',
    phone: '+1234567892'
  }
];

export const initialProducts: Product[] = [
  {
    id: '1',
    barcode: '100001',
    name: 'Classic Burger',
    price: 12.99,
    cost: 4.50,
    quantity: 100,
    category: 'Main Course',
    description: 'Beef patty with lettuce, tomato, and cheese',
    sku: 'BUR001',
    model: 'Food',
  },
  {
    id: '2',
    barcode: '100002',
    name: 'Margherita Pizza',
    price: 15.99,
    cost: 5.00,
    quantity: 50,
    category: 'Main Course',
    description: 'Classic pizza with tomato and mozzarella',
    sku: 'PIZ001',
    model: 'Food',
  },
  {
    id: '3',
    barcode: '100003',
    name: 'Caesar Salad',
    price: 8.99,
    cost: 2.50,
    quantity: 75,
    category: 'Appetizer',
    description: 'Fresh romaine lettuce with Caesar dressing',
    sku: 'SAL001',
    model: 'Food',
  },
  {
    id: '4',
    barcode: '100004',
    name: 'Coca Cola',
    price: 2.50,
    cost: 0.75,
    quantity: 200,
    category: 'Beverage',
    description: '330ml can',
    sku: 'BEV001',
    model: 'Drink',
  }
];

export const initialTables: Table[] = [
  { id: '1', name: 'T01', area: 'Main Hall', capacity: 4 },
  { id: '2', name: 'T02', area: 'Main Hall', capacity: 4 },
  { id: '3', name: 'T03', area: 'Main Hall', capacity: 6 },
  { id: '4', name: 'T04', area: 'Terrace', capacity: 2 },
  { id: '5', name: 'T05', area: 'Terrace', capacity: 2 },
  { id: '6', name: 'T06', area: 'VIP Room', capacity: 8 }
];

export const initialAreas: Area[] = [
  { id: '1', name: 'Main Hall' },
  { id: '2', name: 'Terrace' },
  { id: '3', name: 'VIP Room' },
];

export const initialCategories: Category[] = [
    { id: '1', name: 'Main Course' },
    { id: '2', name: 'Appetizer' },
    { id: '3', name: 'Beverage' },
];

export const initialSales: Sale[] = [];

export const initialSettings = {
    taxRate: 0.1,
    receiptHeader: 'DELICIOUS RESTAURANT\n123 Main Street, City\nPhone: (555) 123-4567',
    receiptFooter: 'Thank you for your visit!\nWe hope to see you again soon!',
};

export const initializeData = (): void => {
  const storage = new StorageService();
  // Only initialize if no data exists
  if (storage.getUsers().length === 0) {
    storage.saveUsers(initialUsers);
    storage.saveProducts(initialProducts);
    storage.saveTables(initialTables);
    storage.saveAreas(initialAreas);
    storage.saveOrders([]);
    storage.saveCategories(initialCategories);
    storage.saveSales(initialSales);
    storage.saveSettings(initialSettings);
    storage.saveReceipts([]);
  }
};
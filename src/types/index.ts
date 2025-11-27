export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cashier' | 'kitchen';
  employeeNo: string;
  password?: string;
}

export interface Product {
  id: string;
  name:string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  image?: string;
  barcode?: string;
  description?: string;
  sku?: string;
  model?: string;
  isDeal?: boolean;
  dealItems?: string[]; // Array of product IDs
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'table' | 'pickup' | 'delivery';
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'preparing' | 'ready';
  createdAt: string; // ISO date string
  employeeId: string;
  employeeName: string;
  paymentMethod: 'cash' | 'card' | 'hybrid';
  cashAmount?: number;
  cardAmount?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  name: string;
  area: string;
  capacity: number;
}

export interface Sale {
  id: string;
  name: string;
  type: 'item' | 'category' | 'flat';
  discount: number; // percentage
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  target?: string; // product id, category name, or 'all'
}

export interface Area {
  id: string;
  name: string;
}

export interface AppData {
  users: User[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  categories?: Category[];
  sales?: Sale[];
  areas: Area[];
  walkinHeldOrders?: OrderItem[][];
  receipts?: Receipt[];
  settings: {
    taxRate: number;
    receiptHeader: string;
    receiptFooter: string;
  };
}

export interface Receipt {
  id: string;
  orderId: string;
  date: string; // ISO date string
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  employeeName: string;
}
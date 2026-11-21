export type Role = 'admin' | 'cashier' | 'kitchen';

/** A staff account as it is stored (includes the password hash). */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  employeeNo: string;
  /** PBKDF2 hash produced by `hashPassword()`. Never a plain-text password. */
  passwordHash: string;
}

/** A staff account as the UI sees it. The password hash never leaves the storage layer. */
export type User = Omit<StoredUser, 'passwordHash'>;

export interface Product {
  id: string;
  name: string;
  category: string;
  /** Base unit price before discounts and tax. */
  price: number;
  cost: number;
  /** Units in stock. Deals don't keep their own stock; they use their items' stock. */
  quantity: number;
  description?: string;
  sku?: string;
  isDeal?: boolean;
  /** Product IDs bundled into a deal. */
  dealItems?: string[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  /** Base unit price. */
  price: number;
  /** Discount per unit. */
  discount: number;
  /** Tax per unit (charged on the discounted price). */
  tax: number;
  /** Line total: (price - discount + tax) * quantity. */
  total: number;
}

export type OrderType = 'dine-in' | 'takeaway';
export type PaymentMethod = 'cash' | 'card' | 'split';
export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'completed' | 'cancelled';
  kitchenStatus: KitchenStatus;
  createdAt: string;
  employeeId: string;
  employeeName: string;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  cardAmount?: number;
  cashTendered?: number;
  changeDue?: number;
}

export interface Receipt {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  tableName?: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  employeeName: string;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  cardAmount?: number;
  cashTendered?: number;
  changeDue?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  name: string;
  /** Area name, or an empty string for a table that shows up in every area. */
  area: string;
  capacity: number;
}

export type DiscountType = 'all' | 'category' | 'item';

export interface Discount {
  id: string;
  name: string;
  type: DiscountType;
  /** Percentage, 0 to 100. */
  percent: number;
  /** First day the discount applies (yyyy-mm-dd, local time). */
  startDate: string;
  /** Last day the discount applies (yyyy-mm-dd, local time, inclusive). */
  endDate: string;
  /** Product ID for `item`, category name for `category`, unused for `all`. */
  target?: string;
}

export interface Settings {
  /** Tax rate as a fraction, e.g. 0.1 for 10%. */
  taxRate: number;
  taxExemptProductIds: string[];
  receiptHeader: string;
  receiptFooter: string;
}

export interface Session {
  userId: string;
}

export interface AppData {
  version: number;
  users: StoredUser[];
  products: Product[];
  categories: Category[];
  discounts: Discount[];
  tables: Table[];
  areas: Area[];
  orders: Order[];
  receipts: Receipt[];
  heldTableOrders: Record<string, OrderItem[]>;
  heldTakeawayOrders: OrderItem[][];
  settings: Settings;
}

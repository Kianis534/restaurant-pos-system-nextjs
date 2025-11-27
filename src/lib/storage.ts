import { AppData, User, Product, Table, Order, OrderItem, Category, Sale, Area, Receipt } from '@/types';

const STORAGE_KEYS = {
  USERS: 'pos_users',
  PRODUCTS: 'pos_products',
  TABLES: 'pos_tables',
  ORDERS: 'pos_orders',
  HELD_ORDERS: 'pos_held_orders',
  WALKIN_HELD_ORDERS: 'pos_walkin_held_orders',
  SETTINGS: 'pos_settings',
  CURRENT_USER: 'pos_current_user',
  CATEGORIES: 'pos_categories',
  SALES: 'pos_sales',
  AREAS: 'pos_areas',
  RECEIPTS: 'pos_receipts',
} as const;

export class StorageService {
  // Users
  getUsers(): User[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Products
  getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  saveProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  // Categories
  getCategories(): Category[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
  }

  saveCategories(categories: Category[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  // Sales
  getSales(): Sale[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
  }

  saveSales(sales: Sale[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  // Tables
  getTables(): Table[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TABLES) || '[]');
  }

  saveTables(tables: Table[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
  }

  // Areas
  getAreas(): Area[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AREAS) || '[]');
  }

  saveAreas(areas: Area[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(areas));
  }

  // Orders
  getOrders(): Order[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  }

  saveOrders(orders: Order[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  // Held Orders
  getHeldOrders(): { [tableId: string]: OrderItem[] } {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HELD_ORDERS) || '{}');
  }

  getHeldOrder(tableId: string): OrderItem[] | null {
    const heldOrders = this.getHeldOrders();
    return heldOrders[tableId] || null;
  }

  saveHeldOrder(tableId: string, order: OrderItem[]): void {
    const heldOrders = this.getHeldOrders();
    heldOrders[tableId] = order;
    localStorage.setItem(STORAGE_KEYS.HELD_ORDERS, JSON.stringify(heldOrders));
  }

  clearHeldOrder(tableId: string): void {
    const heldOrders = this.getHeldOrders();
    delete heldOrders[tableId];
    localStorage.setItem(STORAGE_KEYS.HELD_ORDERS, JSON.stringify(heldOrders));
  }

  // Walk-in Held Orders
  getWalkinHeldOrders(): OrderItem[][] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WALKIN_HELD_ORDERS) || '[]');
  }

  saveWalkinHeldOrders(orders: OrderItem[][]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.WALKIN_HELD_ORDERS, JSON.stringify(orders));
  }

  // Receipts
  getReceipts(): Receipt[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECEIPTS) || '[]');
  }

  saveReceipts(receipts: Receipt[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
  }

  saveReceipt(receipt: Receipt): void {
    const receipts = this.getReceipts();
    receipts.push(receipt);
    this.saveReceipts(receipts);
  }

  // Current User
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user: User | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // Settings
  getSettings() {
    if (typeof window === 'undefined') return { taxRate: 0.1, receiptHeader: '', receiptFooter: '', taxExemptProductIds: [] };
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"taxRate":0.1,"receiptHeader":"","receiptFooter":"","taxExemptProductIds":[]}');
    if (!Array.isArray(settings.taxExemptProductIds)) {
      settings.taxExemptProductIds = [];
    }
    return settings;
  }

  saveSettings(settings: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // Export/Import all data
  exportData(): AppData {
    return {
      users: this.getUsers(),
      products: this.getProducts(),
      categories: this.getCategories(),
      sales: this.getSales(),
      tables: this.getTables(),
      orders: this.getOrders(),
      areas: this.getAreas(),
      settings: this.getSettings(),
      walkinHeldOrders: this.getWalkinHeldOrders(),
      receipts: this.getReceipts(),
    };
  }

  importData(data: AppData): void {
    this.saveUsers(data.users);
    this.saveProducts(data.products);
    this.saveCategories(data.categories || []);
    this.saveSales(data.sales || []);
    this.saveTables(data.tables);
    this.saveOrders(data.orders);
    this.saveAreas(data.areas || []);
    this.saveSettings(data.settings);
    this.saveWalkinHeldOrders(data.walkinHeldOrders || []);
    this.saveReceipts(data.receipts || []);
  }

  // Clear all data
  clearAll(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

// Expose StorageService to the window object for console access in development
if (typeof window !== 'undefined') {
  (window as any).StorageService = new StorageService();
}

/*
  To clear specific storage items, open your browser's Developer Console (F12) on your application page. Then, use
  StorageService.saveOrders([]) to clear recent transactions (orders). For other data, use
  StorageService.saveProducts([]), StorageService.saveUsers([]), StorageService.saveCategories([]),
  StorageService.saveSales([]), or StorageService.saveTables([]). To reset settings, use
  localStorage.removeItem('pos_settings') and refresh.
  */
import type {
  AppData,
  Area,
  Category,
  Discount,
  KitchenStatus,
  Order,
  OrderItem,
  Product,
  Receipt,
  Session,
  Settings,
  StoredUser,
  Table,
  User,
} from '@/types';
import { hashPassword, isPasswordHash } from './password';
import { restoreStock } from './inventory';
import { markVoided, type VoidInput } from './voids';
import { toLocalDateKey } from './format';
import {
  seedAreas,
  seedCategories,
  seedDiscounts,
  seedProducts,
  seedSettings,
  seedTables,
  seedUsers,
} from './seed';

/**
 * All app data lives in the browser's localStorage. This class is the only code that
 * touches it: reads are defensive (bad JSON or missing fields fall back to defaults) and
 * every write fires a `pos:data-changed` event so open screens can refresh.
 */

export const DATA_VERSION = 2;
export const DATA_CHANGED_EVENT = 'pos:data-changed';

const KEYS = {
  version: 'pos_version',
  users: 'pos_users',
  products: 'pos_products',
  categories: 'pos_categories',
  discounts: 'pos_discounts',
  tables: 'pos_tables',
  areas: 'pos_areas',
  orders: 'pos_orders',
  receipts: 'pos_receipts',
  heldTableOrders: 'pos_held_orders',
  heldTakeawayOrders: 'pos_walkin_held_orders',
  takeawayDraft: 'pos_takeaway_draft',
  settings: 'pos_settings',
  session: 'pos_session',
} as const;

/** Keys written by older versions of the app, cleaned up during migration. */
const LEGACY_KEYS = { currentUser: 'pos_current_user', sales: 'pos_sales' } as const;

export const STORAGE_KEYS = KEYS;

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

function browserStore(): KeyValueStore | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null; // Storage can be blocked entirely (privacy mode, sandboxed iframes).
  }
}

// ---------- normalisers: turn whatever is stored or imported into well-formed records ----------

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const optNum = (v: unknown): number | undefined => (v === undefined || v === null ? undefined : num(v));
const list = <T>(v: unknown, map: (x: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.map(map).filter((x): x is T => x !== null) : [];

function toDateKey(v: unknown): string {
  const s = str(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? toLocalDateKey(new Date()) : toLocalDateKey(d);
}

function normalizeUser(v: unknown): StoredUser | null {
  if (!isObject(v) || !str(v.id) || !str(v.employeeNo)) return null;
  const role = v.role === 'admin' || v.role === 'kitchen' ? v.role : 'cashier';
  return {
    id: str(v.id),
    employeeNo: str(v.employeeNo),
    name: str(v.name, str(v.employeeNo)),
    role,
    email: str(v.email),
    phone: str(v.phone),
    passwordHash: isPasswordHash(v.passwordHash) ? v.passwordHash : '',
  };
}

function normalizeProduct(v: unknown): Product | null {
  if (!isObject(v) || !str(v.id) || !str(v.name)) return null;
  const product: Product = {
    id: str(v.id),
    name: str(v.name),
    category: str(v.category),
    price: Math.max(0, num(v.price)),
    cost: Math.max(0, num(v.cost)),
    quantity: Math.trunc(num(v.quantity)),
  };
  if (str(v.description)) product.description = str(v.description);
  if (str(v.sku)) product.sku = str(v.sku);
  if (v.isDeal === true) {
    product.isDeal = true;
    product.dealItems = list(v.dealItems, (x) => (typeof x === 'string' ? x : null));
    product.quantity = 0;
  }
  return product;
}

function normalizeNamed(v: unknown): { id: string; name: string } | null {
  return isObject(v) && str(v.id) && str(v.name) ? { id: str(v.id), name: str(v.name) } : null;
}

function normalizeTable(v: unknown): Table | null {
  if (!isObject(v) || !str(v.id) || !str(v.name)) return null;
  return { id: str(v.id), name: str(v.name), area: str(v.area), capacity: Math.max(1, Math.trunc(num(v.capacity, 1))) };
}

function normalizeDiscount(v: unknown): Discount | null {
  if (!isObject(v) || !str(v.id)) return null;
  // Older versions called this a "sale": type 'flat' and the percentage in `discount`.
  const rawType = str(v.type);
  const type = rawType === 'category' || rawType === 'item' ? rawType : 'all';
  const percent = Math.min(100, Math.max(0, num(v.percent, num(v.discount))));
  const discount: Discount = {
    id: str(v.id),
    name: str(v.name, 'Discount'),
    type,
    percent,
    startDate: toDateKey(v.startDate),
    endDate: toDateKey(v.endDate),
  };
  if (type !== 'all' && str(v.target)) discount.target = str(v.target);
  return discount;
}

function normalizeItem(v: unknown): OrderItem | null {
  if (!isObject(v) || !str(v.productId)) return null;
  const quantity = Math.max(1, Math.trunc(num(v.quantity, 1)));
  const price = num(v.price);
  const discount = num(v.discount);
  const tax = num(v.tax);
  return {
    id: str(v.id, `${str(v.productId)}-${quantity}`),
    productId: str(v.productId),
    productName: str(v.productName, 'Item'),
    quantity,
    price,
    discount,
    tax,
    total: num(v.total, (price - discount + tax) * quantity),
  };
}

function normalizePaymentMethod(v: unknown): Order['paymentMethod'] {
  if (v === 'card') return 'card';
  if (v === 'split' || v === 'hybrid') return 'split';
  return 'cash';
}

function normalizeOrder(v: unknown): Order | null {
  if (!isObject(v) || !str(v.id)) return null;
  const items = list(v.items, normalizeItem);
  // Older versions used type 'table' / 'pickup' / 'delivery' and mixed kitchen states into `status`.
  const type = v.type === 'table' || v.type === 'dine-in' ? 'dine-in' : 'takeaway';
  const legacyStatus = str(v.status);
  const kitchen: KitchenStatus[] = ['pending', 'preparing', 'ready', 'served'];
  const kitchenStatus = kitchen.includes(v.kitchenStatus as KitchenStatus)
    ? (v.kitchenStatus as KitchenStatus)
    : kitchen.includes(legacyStatus as KitchenStatus)
      ? (legacyStatus as KitchenStatus)
      : 'served';
  const order: Order = {
    id: str(v.id),
    orderNumber: str(v.orderNumber, str(v.id)),
    type,
    items,
    subtotal: num(v.subtotal),
    discount: num(v.discount),
    tax: num(v.tax),
    total: num(v.total),
    status: legacyStatus === 'cancelled' ? 'cancelled' : 'completed',
    kitchenStatus,
    createdAt: str(v.createdAt, new Date(0).toISOString()),
    employeeId: str(v.employeeId),
    employeeName: str(v.employeeName),
    paymentMethod: normalizePaymentMethod(v.paymentMethod),
  };
  if (str(v.tableId)) order.tableId = str(v.tableId);
  if (str(v.tableName)) order.tableName = str(v.tableName);
  for (const key of ['cashAmount', 'cardAmount', 'cashTendered', 'changeDue'] as const) {
    const value = optNum(v[key]);
    if (value !== undefined) order[key] = value;
  }
  if (order.status === 'cancelled') {
    for (const key of ['voidedAt', 'voidedBy', 'voidReason'] as const) if (str(v[key])) order[key] = str(v[key]);
  }
  return order;
}

function normalizeReceipt(v: unknown, orders: Order[]): Receipt | null {
  if (!isObject(v) || !str(v.id)) return null;
  const order = orders.find((o) => o.id === str(v.orderId));
  const receipt: Receipt = {
    id: str(v.id),
    orderId: str(v.orderId),
    orderNumber: str(v.orderNumber, order?.orderNumber ?? ''),
    orderType: v.orderType === 'dine-in' || v.orderType === 'takeaway' ? v.orderType : (order?.type ?? 'takeaway'),
    date: str(v.date, order?.createdAt ?? new Date(0).toISOString()),
    items: list(v.items, normalizeItem),
    subtotal: num(v.subtotal),
    discount: num(v.discount),
    tax: num(v.tax),
    total: num(v.total),
    employeeName: str(v.employeeName),
    paymentMethod: normalizePaymentMethod(v.paymentMethod ?? order?.paymentMethod),
  };
  const tableName = str(v.tableName, order?.tableName ?? '');
  if (tableName) receipt.tableName = tableName;
  for (const key of ['cashAmount', 'cardAmount', 'cashTendered', 'changeDue'] as const) {
    const value = optNum(v[key] ?? order?.[key]);
    if (value !== undefined) receipt[key] = value;
  }
  // A voided order voids its receipt too, even if only the order record was updated.
  for (const key of ['voidedAt', 'voidedBy', 'voidReason'] as const) {
    const value = str(v[key], order?.[key] ?? '');
    if (value) receipt[key] = value;
  }
  return receipt;
}

function normalizeSettings(v: unknown): Settings {
  const defaults = seedSettings();
  if (!isObject(v)) return defaults;
  // An older settings screen saved the rate as `globalTaxRate` while checkout read `taxRate`.
  const rate = Number.isFinite(v.globalTaxRate as number) ? (v.globalTaxRate as number) : num(v.taxRate, defaults.taxRate);
  return {
    taxRate: Math.min(1, Math.max(0, rate)),
    taxExemptProductIds: list(v.taxExemptProductIds, (x) => (typeof x === 'string' ? x : null)),
    receiptHeader: str(v.receiptHeader),
    receiptFooter: str(v.receiptFooter),
  };
}

function normalizeHeldTableOrders(v: unknown): Record<string, OrderItem[]> {
  if (!isObject(v)) return {};
  const out: Record<string, OrderItem[]> = {};
  for (const [tableId, items] of Object.entries(v)) {
    const normalized = list(items, normalizeItem);
    if (normalized.length) out[tableId] = normalized;
  }
  return out;
}

function normalizeHeldTakeaway(v: unknown): OrderItem[][] {
  return Array.isArray(v) ? v.map((order) => list(order, normalizeItem)).filter((o) => o.length > 0) : [];
}

export function toPublicUser(user: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------- the service ----------

export class StorageService {
  private readonly store: KeyValueStore;
  private readonly notify: boolean;

  constructor(store?: KeyValueStore) {
    const browser = browserStore();
    this.store = store ?? browser ?? createMemoryStore();
    this.notify = !store && !!browser;
  }

  private read(key: string): unknown {
    const raw = this.store.getItem(key);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn(`Ignoring unreadable data in localStorage key "${key}".`);
      return undefined;
    }
  }

  private write(key: string, value: unknown): void {
    this.store.setItem(key, JSON.stringify(value));
    if (this.notify) window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { key } }));
  }

  // Users
  getUsers(): StoredUser[] {
    return list(this.read(KEYS.users), normalizeUser);
  }
  saveUsers(users: StoredUser[]): void {
    this.write(KEYS.users, users);
  }
  getPublicUsers(): User[] {
    return this.getUsers().map(toPublicUser);
  }

  // Catalogue
  getProducts(): Product[] {
    return list(this.read(KEYS.products), normalizeProduct);
  }
  saveProducts(products: Product[]): void {
    this.write(KEYS.products, products);
  }
  getCategories(): Category[] {
    return list(this.read(KEYS.categories), normalizeNamed);
  }
  saveCategories(categories: Category[]): void {
    this.write(KEYS.categories, categories);
  }
  getDiscounts(): Discount[] {
    return list(this.read(KEYS.discounts), normalizeDiscount);
  }
  saveDiscounts(discounts: Discount[]): void {
    this.write(KEYS.discounts, discounts);
  }

  // Floor plan
  getTables(): Table[] {
    return list(this.read(KEYS.tables), normalizeTable);
  }
  saveTables(tables: Table[]): void {
    this.write(KEYS.tables, tables);
  }
  getAreas(): Area[] {
    return list(this.read(KEYS.areas), normalizeNamed);
  }
  saveAreas(areas: Area[]): void {
    this.write(KEYS.areas, areas);
  }

  // Orders and receipts
  getOrders(): Order[] {
    return list(this.read(KEYS.orders), normalizeOrder);
  }
  saveOrders(orders: Order[]): void {
    this.write(KEYS.orders, orders);
  }
  updateOrder(id: string, patch: Partial<Order>): void {
    this.saveOrders(this.getOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  /**
   * Voids a paid order: marks it (and its receipt) as voided and puts its items back into
   * stock. Throws if the order doesn't exist, is already voided or the reason is missing.
   */
  voidOrder(id: string, input: VoidInput): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error('That order no longer exists.');
    const voided = markVoided(order, input);
    this.saveOrders(orders.map((o) => (o.id === id ? voided : o)));
    this.saveReceipts(
      this.getReceipts().map((r) =>
        r.orderId === id ? { ...r, voidedAt: voided.voidedAt, voidedBy: voided.voidedBy, voidReason: voided.voidReason } : r,
      ),
    );
    this.saveProducts(restoreStock(this.getProducts(), order.items));
    return voided;
  }
  getReceipts(): Receipt[] {
    const orders = this.getOrders();
    return list(this.read(KEYS.receipts), (v) => normalizeReceipt(v, orders));
  }
  saveReceipts(receipts: Receipt[]): void {
    this.write(KEYS.receipts, receipts);
  }

  /** Next sequential order number, e.g. ORD-000042. */
  nextOrderNumber(): string {
    const highest = this.getOrders().reduce((max, o) => {
      // Only count our own short numbers; older versions used timestamps like ORD-1700000000000.
      const match = /^ORD-(\d{1,9})$/.exec(o.orderNumber);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `ORD-${String(highest + 1).padStart(6, '0')}`;
  }

  // Orders on hold
  getHeldTableOrders(): Record<string, OrderItem[]> {
    return normalizeHeldTableOrders(this.read(KEYS.heldTableOrders));
  }
  getHeldTableOrder(tableId: string): OrderItem[] {
    return this.getHeldTableOrders()[tableId] ?? [];
  }
  saveHeldTableOrder(tableId: string, items: OrderItem[]): void {
    const held = this.getHeldTableOrders();
    if (items.length) held[tableId] = items;
    else delete held[tableId];
    this.write(KEYS.heldTableOrders, held);
  }
  clearHeldTableOrder(tableId: string): void {
    this.saveHeldTableOrder(tableId, []);
  }
  getHeldTakeawayOrders(): OrderItem[][] {
    return normalizeHeldTakeaway(this.read(KEYS.heldTakeawayOrders));
  }
  saveHeldTakeawayOrders(orders: OrderItem[][]): void {
    this.write(KEYS.heldTakeawayOrders, orders.filter((o) => o.length > 0));
  }

  /** The takeaway order being rung up right now, so leaving the screen doesn't lose it. */
  getTakeawayDraft(): OrderItem[] {
    return list(this.read(KEYS.takeawayDraft), normalizeItem);
  }
  saveTakeawayDraft(items: OrderItem[]): void {
    // Written on every tap, and nothing re-reads it while the screen is open, so it skips
    // the change event that would make every subscribed screen re-read storage.
    if (items.length) this.store.setItem(KEYS.takeawayDraft, JSON.stringify(items));
    else this.store.removeItem(KEYS.takeawayDraft);
  }

  // Settings
  getSettings(): Settings {
    return normalizeSettings(this.read(KEYS.settings));
  }
  saveSettings(settings: Settings): void {
    this.write(KEYS.settings, normalizeSettings(settings));
  }

  // Session (only the user id is stored, never the account record)
  getSession(): Session | null {
    const value = this.read(KEYS.session);
    return isObject(value) && str(value.userId) ? { userId: str(value.userId) } : null;
  }
  setSession(session: Session | null): void {
    if (session) this.write(KEYS.session, session);
    else this.store.removeItem(KEYS.session);
  }

  // Lifecycle
  hasData(): boolean {
    return this.store.getItem(KEYS.users) !== null;
  }

  /** Loads the demo data when the browser has none, and upgrades data saved by older versions. */
  async initialize(): Promise<void> {
    if (!this.hasData()) {
      this.loadDemoData();
      return;
    }
    const version = num(this.read(KEYS.version), 1);
    if (version < DATA_VERSION) await this.migrateFromV1();
  }

  loadDemoData(): void {
    this.saveUsers(seedUsers());
    this.saveProducts(seedProducts);
    this.saveCategories(seedCategories);
    this.saveDiscounts(seedDiscounts());
    this.saveTables(seedTables);
    this.saveAreas(seedAreas);
    this.saveOrders([]);
    this.saveReceipts([]);
    this.write(KEYS.heldTableOrders, {});
    this.saveHeldTakeawayOrders([]);
    this.saveSettings(seedSettings());
    this.write(KEYS.version, DATA_VERSION);
  }

  /** Wipes everything (including the session) and loads the demo data again. */
  resetToDemoData(): void {
    this.clearAll();
    this.loadDemoData();
  }

  clearAll(): void {
    for (const key of [...Object.values(KEYS), ...Object.values(LEGACY_KEYS)]) this.store.removeItem(key);
  }

  private async migrateFromV1(): Promise<void> {
    // v1 stored plain-text passwords. Hash them and drop the plain text.
    const raw = this.read(KEYS.users);
    if (Array.isArray(raw)) {
      const users: StoredUser[] = [];
      for (const entry of raw) {
        const user = normalizeUser(entry);
        if (!user) continue;
        if (!user.passwordHash && isObject(entry) && typeof entry.password === 'string' && entry.password) {
          user.passwordHash = await hashPassword(entry.password);
        }
        users.push(user);
      }
      this.saveUsers(users);
    }
    // v1 called discounts "sales".
    const legacySales = this.read(LEGACY_KEYS.sales);
    if (Array.isArray(legacySales) && this.read(KEYS.discounts) === undefined) {
      this.saveDiscounts(list(legacySales, normalizeDiscount));
    }
    // Rewrite everything else through the normalisers so it matches the current shape.
    this.saveSettings(this.getSettings());
    this.saveProducts(this.getProducts());
    this.saveOrders(this.getOrders());
    this.saveReceipts(this.getReceipts());
    this.store.removeItem(LEGACY_KEYS.sales);
    this.store.removeItem(LEGACY_KEYS.currentUser); // v1 kept the whole user record, password included.
    this.write(KEYS.version, DATA_VERSION);
  }

  // Backup and restore
  exportData(): AppData {
    return {
      version: DATA_VERSION,
      users: this.getUsers(),
      products: this.getProducts(),
      categories: this.getCategories(),
      discounts: this.getDiscounts(),
      tables: this.getTables(),
      areas: this.getAreas(),
      orders: this.getOrders(),
      receipts: this.getReceipts(),
      heldTableOrders: this.getHeldTableOrders(),
      heldTakeawayOrders: this.getHeldTakeawayOrders(),
      settings: this.getSettings(),
    };
  }

  /** Replaces all data with a backup. Throws if the file isn't a backup made by this app. */
  importData(data: unknown): void {
    if (!isObject(data) || !Array.isArray(data.users) || !Array.isArray(data.products)) {
      throw new Error('This file is not a POS backup.');
    }
    const users = list(data.users, normalizeUser).filter((u) => u.passwordHash);
    if (!users.some((u) => u.role === 'admin')) {
      throw new Error('The backup has no admin account with a valid password, so nobody could sign in.');
    }
    const orders = list(data.orders, normalizeOrder);
    this.saveUsers(users);
    this.saveProducts(list(data.products, normalizeProduct));
    this.saveCategories(list(data.categories, normalizeNamed));
    this.saveDiscounts(list(data.discounts ?? data.sales, normalizeDiscount));
    this.saveTables(list(data.tables, normalizeTable));
    this.saveAreas(list(data.areas, normalizeNamed));
    this.saveOrders(orders);
    this.saveReceipts(list(data.receipts, (v) => normalizeReceipt(v, orders)));
    this.write(KEYS.heldTableOrders, normalizeHeldTableOrders(data.heldTableOrders));
    this.saveHeldTakeawayOrders(normalizeHeldTakeaway(data.heldTakeawayOrders ?? data.walkinHeldOrders));
    this.saveSettings(normalizeSettings(data.settings));
    this.write(KEYS.version, DATA_VERSION);
  }
}

/** Shared instance for the app. Tests create their own with an in-memory store. */
export const storage = new StorageService();

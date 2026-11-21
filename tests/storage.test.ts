import { describe, expect, it } from 'vitest';
import { DATA_VERSION, StorageService } from '@/lib/storage';
import { verifyPassword } from '@/lib/password';
import { memoryStore } from './fixtures';

describe('first run', () => {
  it('loads the demo data once', async () => {
    const store = memoryStore();
    const storage = new StorageService(store);
    await storage.initialize();
    expect(storage.getUsers().map((u) => u.employeeNo)).toEqual(['admin001', 'cashier001', 'kitchen001']);
    expect(storage.getProducts().length).toBeGreaterThan(5);
    expect(storage.getTables()).toHaveLength(6);
    expect(storage.getDiscounts()).toHaveLength(1);
    expect(store.getItem('pos_version')).toBe(String(DATA_VERSION));

    storage.saveTables([]);
    await storage.initialize();
    expect(storage.getTables()).toEqual([]); // not re-seeded
  });

  it('never stores plain-text passwords', async () => {
    const store = memoryStore();
    await new StorageService(store).initialize();
    const raw = JSON.stringify(store.dump());
    expect(raw).not.toMatch(/admin123|cashier123|kitchen123/);
  });
});

describe('upgrading data saved by the original version', () => {
  const legacy = {
    pos_users: [
      { id: '1', employeeNo: 'admin001', password: 'admin123', name: 'Admin', role: 'admin', email: '', phone: '' },
    ],
    pos_current_user: { id: '1', employeeNo: 'admin001', password: 'admin123' },
    pos_settings: { taxRate: 0.1, globalTaxRate: 0.07, receiptHeader: 'Hi', receiptFooter: 'Bye', taxExemptProductIds: [] },
    pos_sales: [{ id: 's1', name: 'Old sale', type: 'flat', discount: 12, startDate: '2026-01-01T10:00:00.000Z', endDate: '2026-01-31T10:00:00.000Z', target: 'all' }],
    pos_orders: [
      {
        id: 'o1',
        orderNumber: 'ORD-1700000000000',
        type: 'table',
        tableId: '1',
        items: [{ id: 'i1', productId: '1', productName: 'Burger', quantity: 1, price: 10, tax: 1, total: 11 }],
        subtotal: 10,
        tax: 1,
        total: 11,
        status: 'completed',
        createdAt: '2026-01-05T10:00:00.000Z',
        employeeId: '1',
        employeeName: 'Admin',
        paymentMethod: 'hybrid',
        cashAmount: 5,
        cardAmount: 6,
      },
    ],
    pos_receipts: [{ id: 'REC-1', orderId: 'o1', date: '2026-01-05T10:00:00.000Z', items: [], subtotal: 10, tax: 1, total: 11, employeeName: 'Admin' }],
  };

  it('hashes old passwords, fixes settings and renames old fields', async () => {
    const store = memoryStore(legacy);
    const storage = new StorageService(store);
    await storage.initialize();

    const [admin] = storage.getUsers();
    expect(admin.passwordHash).toMatch(/^pbkdf2-sha256:/);
    expect(await verifyPassword('admin123', admin.passwordHash)).toBe(true);
    expect(JSON.stringify(store.dump())).not.toContain('"password"');
    expect(store.getItem('pos_current_user')).toBeNull();

    expect(storage.getSettings().taxRate).toBe(0.07);
    expect(storage.getDiscounts()).toEqual([
      { id: 's1', name: 'Old sale', type: 'all', percent: 12, startDate: '2026-01-01', endDate: '2026-01-31' },
    ]);
    expect(store.getItem('pos_sales')).toBeNull();

    const [order] = storage.getOrders();
    expect(order).toMatchObject({ type: 'dine-in', paymentMethod: 'split', discount: 0, kitchenStatus: 'served' });
    expect(order.items[0].discount).toBe(0);
    expect(storage.getReceipts()[0]).toMatchObject({ orderNumber: 'ORD-1700000000000', orderType: 'dine-in', paymentMethod: 'split' });
    expect(store.getItem('pos_version')).toBe(String(DATA_VERSION));
  });
});

describe('robustness', () => {
  it('ignores unreadable JSON instead of crashing', () => {
    const storage = new StorageService(memoryStore({ pos_products: '{not json' }));
    expect(storage.getProducts()).toEqual([]);
  });

  it('drops records that are missing required fields', () => {
    const storage = new StorageService(memoryStore({ pos_products: [{ id: 'ok', name: 'Tea', price: '2.5' }, { name: 'no id' }, null] }));
    expect(storage.getProducts()).toEqual([{ id: 'ok', name: 'Tea', category: '', price: 2.5, cost: 0, quantity: 0 }]);
  });

  it('numbers orders sequentially', () => {
    const storage = new StorageService(memoryStore());
    expect(storage.nextOrderNumber()).toBe('ORD-000001');
    storage.saveOrders([{ orderNumber: 'ORD-000041' }, { orderNumber: 'ORD-1700000000000' }].map((o, i) => ({ ...o, id: String(i) })) as never);
    expect(storage.nextOrderNumber()).toBe('ORD-000042');
  });

  it('keeps held table orders per table and removes empty ones', () => {
    const storage = new StorageService(memoryStore());
    const item = { id: 'x', productId: 'p', productName: 'P', quantity: 2, price: 1, discount: 0, tax: 0.1, total: 2.2 };
    storage.saveHeldTableOrder('t1', [item]);
    expect(storage.getHeldTableOrder('t1')).toEqual([item]);
    storage.clearHeldTableOrder('t1');
    expect(storage.getHeldTableOrders()).toEqual({});
  });

  it('stores only the user id in the session', () => {
    const store = memoryStore();
    new StorageService(store).setSession({ userId: 'u1' });
    expect(store.getItem('pos_session')).toBe('{"userId":"u1"}');
  });
});

describe('backup and restore', () => {
  it('round-trips everything through export and import', async () => {
    const source = new StorageService(memoryStore());
    await source.initialize();
    const backup = JSON.parse(JSON.stringify(source.exportData()));

    const target = new StorageService(memoryStore());
    target.importData(backup);
    expect(target.exportData()).toEqual(source.exportData());
  });

  it('refuses files that are not backups or would lock everyone out', async () => {
    const target = new StorageService(memoryStore());
    expect(() => target.importData({ hello: 'world' })).toThrow('not a POS backup');
    expect(() => target.importData({ users: [{ id: '1', employeeNo: 'a', role: 'admin', password: 'plain' }], products: [] })).toThrow(/no admin account/);
  });
});
